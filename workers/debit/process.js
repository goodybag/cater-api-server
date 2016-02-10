'use strict';

var domain = require('domain');
var utils = require('../../utils');
var moduleLogger = require('./logger').create('Process');
var models = require('../../models');
var db = require('../../db');
var config = require('../../config');
var _ = utils._;
var scheduler = require('../../lib/scheduler');
var restaurantPlans = require('../../public/js/lib/restaurant-plans');
var OrderCharge = require('stamps/orders/charge');
var moment = require('moment-timezone');

var setPaymentUnprocessed = function( order, callback ){
  db.orders.update( order.id, { payment_status: null }, callback );
};

var setPaymentError = function( order, error, callback ){
  moduleLogger.info('Received payment error', {
    order: { id: order.id }
  , error: error
  });

  return ( new models.Order( order ) ).setPaymentError( error, function(){
    return callback( error );
  });
};

var checkForExistingDebit = function (order, callback) {
  var logger = moduleLogger.create('checkForExistingDebit', {
    data: { order: order }
  });

  utils.stripe.charges.list({
    created: { gte: moment(order.datetime).unix() }
  }, function(err, charges) {
    if (err) {
      logger.error({ error: err });
      return callback(err);
    }

    logger.debug('Listing debits');

    function matchesUuid(charge) {
      return charge.metadata.order_uuid === order.uuid;
    }

    function failedCharge (charge) {
      return charge.status !== 'failed';
    }

    if (charges && charges.data) {
      var debits = charges.data.filter(matchesUuid).filter(failedCharge);
      return callback(null, debits[0]);
    }

    logger.debug('Clear for charging');
    return callback(null, null);
  });
};

var debitCustomer = function (order, callback) {
  var logger = moduleLogger.create('debitCustomer', {
    data: { order: order }
  });

  var amount = Math.floor(order.total);
  if (typeof amount === 'undefined' || amount === null || amount === 0) return callback(new Error('invalid amount: ' + amount));

  var pmId = order.payment_method_id;
  models.PaymentMethod.findOne(pmId, function(error, paymentMethod) {
    if ( error ){
      return setPaymentError( order,  error, callback );
    }

    if ( !paymentMethod ){
      return setPaymentError( order, {
        message: 'Payment method could not be found'
      , payment_method_id: pmId
      }, callback );
    }

    db.users.findOne(order.user_id, function(err, user) {
      if ( err ) return setPaymentError( order,  err, callback );

      var customer = user.stripe_id;
      var source = paymentMethod.attributes.stripe_id;
      var charge = OrderCharge( order );

      var data = {
        amount: charge.getTotal(),
        currency: 'usd',
        customer: customer,
        source: source,
        statement_descriptor: 'GOODYBAG CATER #' + order.id,
        description: 'Order #' + order.id,
        metadata: {
          user_id: order.user.id
        , restaurant_id: order.restaurant.id
        , order_id: order.id
        , order_uuid: order.uuid
        , charge_destination: 'Funds go to Goodybag Platform'
        }
      };

      if ( !order.restaurant.collect_payments )
      if ( order.restaurant.is_direct_deposit )
      if ( order.restaurant.plan_id ) {
        // route to restaurant if possible
        data.destination = order.restaurant.stripe_id;
        data.application_fee = charge.getApplicationCut();
        data.metadata.charge_destination = 'Funds go to restaurant';
      }

      utils.stripe.charges.create(data, function (error, charge) {
        if (error) {
          return setPaymentError( order,  error, callback );
        }

        return (new models.Order(order)).setPaymentPaid('debit', charge, callback);
      });
    });
  });
};

var task = function (message, callback) {
  var d = process.domain;
  if (!message) return callback();
  var logger = moduleLogger.create('task', {
    data: { message: message }
  });

  // if data is bad remove it from the queue immediately
  var body;
  try {
    body = JSON.parse(message.body);
  } catch (e) {
    logger.error('unable to parse message body: ' + message.body);
    return utils.queues.debit.del(message.id, utils.noop), callback(e);
  }

  logger.info("processing order: " + body.order.id);

  var $options = {
    one: [ { table: 'restaurants', alias: 'restaurant'
           , one: [ { table: 'restaurant_plans', alias: 'plan' }
                  , { table: 'regions', alias: 'region' }
                  ]
           }
         , { table: 'users', alias: 'user' }
         ]
  , many: [ { table: 'order_items', alias: 'items' }
          , { table: 'order_amenities', alias: 'amenities'
            , mixin: [{ table: 'amenities' }]
            }
          ]
  };
  db.orders.findOne( body.order.id, $options, d.bind(function(error, order) {
    if ( error ){
      logger.error('Error looking up order', {
        error: error
      , order: { id: body.order.id }
      });
      return setPaymentError( body.order, error, callback );
    }

    if ( !order ){
      utils.queues.debit.del(message.id, utils.noop);
      let error = { message: 'Could not find order', id: body.order.id };
      return setPaymentError( body.order, error, callback );
    }

    if (_.contains(['invoiced', 'paid', 'ignore'], order.payment_status)) return utils.queues.debit.del(message.id, utils.noop), callback();

    // check to see if a debit was already successfuly processed for this order
    // if so it means that there was an error in updating our system with the
    // debit information and we should attempt to update our system again.
    checkForExistingDebit(order, function (error, debit) {
      // attempt to process this from the queue again later
      if (error) {
        logger.error('checkForExistingDebit returned an error', {
          error: error
        , order: { id: order.id }
        });
        return setPaymentError( order, error, callback );
      }

      if (debit) {
        logger.warn('found existing debit for order: ' + order.id);
        return (new models.Order(order)).setPaymentPaid('debit', debit, function (error) {
          if (error) {
            logger.error('Error changing status to paid', { error: error });
            return setPaymentError( order, error, callback );
          }
          utils.queues.debit.del(message.id, function(){
            callback()
          });
        });
      }

      // if no debit then continue to process

      // if the status is processing there is no need to set the payment status to processing again
      if (order.payment_status != 'processing') {
        var $update = { payment_status: 'processing' };
        db.orders.update( order.id, $update, d.bind(function(error) {
          if (error){
            logger.error( 'Error updating order to processing', {
              error: error
            , order: { id: order.id }
            });
            return setPaymentError( order, error, callback );
          }
          debitCustomer(order, function (error) {
            utils.queues.debit.del(message.id, utils.noop);
            if (error) logger.error('Error debiting customer', {
              error: error
            , order: { id: order.id }
            });
            return callback(error);
          });
        }));
      } else {
        debitCustomer(order, function (error) {
          utils.queues.debit.del(message.id, utils.noop);
          if (error) {
            logger.error({error: error});
          }
          return callback(error);
        });
      }
    });
  }));
};

var worker = function (message, callback) {
  var d = domain.create();
  d.uuid = utils.uuid.v4();
  d.once('error', function (error) {
    console.error('Domain error', { error: error });
    callback(error);
  });
  d.run(function () {
    task(message, callback);
  });
};

var done = function (error) {
  if (!error) return;
  moduleLogger.error('task error', { error: error });
  utils.rollbar.reportMessage(error);
};

var q = utils.async.queue(worker, 5);

setInterval(function () {
  if (q.length() > 5) return; // don't poll ironMQ unless we are running out of work

  utils.queues.debit.get({
    n: 25 // pull 25 items off the queue
  , timeout: 300 // allow up to 5 minutes for processing before putting it back onto the queue
  }, function (error, messages) {
    if (error) return moduleLogger.error('Error fetching from queue', {error: error});
    _.each(messages, function (m) {
      q.push(m, done);
    });
  });
}, config.workers.debit.process.interval);
