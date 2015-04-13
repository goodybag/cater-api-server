var domain = require('domain');
var utils = require('../../utils');
var logger = require('./logger').create('Process');
var models = require('../../models');
var db = require('../../db');
var config = require('../../config');
var _ = utils._;
var scheduler = require('../../lib/scheduler');
var restaurantPlans = require('../../public/js/lib/restaurant-plans');

var checkForExistingDebit = function (order, callback) {
  var logger = process.domain.logger.create('checkForExistingDebit', {
    data: { order: order }
  });

  var query = {'meta.order_uuid': order.uuid};
  logger.info('Listing debits');
  utils.balanced.Debits.list(query, function (error, debits) {
    if (error){
      logger.error({ error: error });
      return callback(error);
    }

    if (debits && debits.total > 1){
      logger.error('Multiple debits for a single order');
      return callback(new Error('multiple debits for a single order: ' + order.id));
    }
    if (debits && debits.total == 1) return callback (null, debits.items[0]);
    return callback(null, null);
  });
};

var debitCustomer = function (order, callback) {
  var logger = process.domain.logger.create('debitCustomer', {
    data: { order: order }
  });

  var amount = Math.floor(order.total);
  if (typeof amount === 'undefined' || amount === null || amount === 0) return callback(new Error('invalid amount: ' + amount));

  var pmId = order.payment_method_id;
  models.PaymentMethod.findOne(pmId, function(error, paymentMethod) {
    if (error) return callback(new Error('invalid payment method: ' + pmId));

    db.users.findOne(order.user_id, function(err, user) {
      if ( err ) return callback({ error: err });
      utils.stripe.charges.create({
        amount: amount,
        currency: 'usd',
        customer: user.stripe_id,
        source: paymentMethod.attributes.stripe_id,
        destination: order.restaurant.stripe_id,
        application_fee: order.restaurant.plan_id ?
                           restaurantPlans[order.restaurant.plan.type].getGbFee(order.restaurant.plan, order) :
                           0,
        statement_descriptor: 'GOODYBAG CATER #' + order.id,
        metadata: {
          user_id: order.user.id
        , restaurant_id: order.restaurant.id
        , order_id: order.id
        , order_uuid: order.uuid
        }
      },
      function (error, charge) {
        if (error) {
          // enqueue declined cc notification on scheduler
          return scheduler.enqueue('send-order-notification', new Date(), {
            notification_id: 'user-order-payment-failed'
          , order_id: order.id
          }, function (err) {
            if (err) {
              logger.error({ error: err });
            }
            // construct a model to run the following transactions
            return (new models.Order(order)).setPaymentError(error, callback);
          });
        }
        return (new models.Order(order)).setPaymentPaid('debit', charge, callback);
      });
    });
  });
};

var task = function (message, callback) {
  var d = process.domain;
  if (!message) return callback();
  var logger = process.domain.logger.create('task', {
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
    one: [
      { table: 'restaurants', alias: 'restaurant', one: [ { table: 'restaurant_plans', alias: 'plan' } ] }
    , { table: 'users', alias: 'user' }
    ]
  };
  db.orders.findOne( body.order.id, $options, d.bind(function(error, order) {
    if ( error ) return logger.create('DB').error({error: error}), callback(error);
    if ( !order ) return utils.queues.debit.del(message.id, utils.noop), callback();
    if (_.contains(['invoiced', 'paid', 'ignore'], order.payment_status)) return utils.queues.debit.del(message.id, utils.noop), callback();

    // check to see if a debit was already successfuly processed for this order
    // if so it means that there was an error in updating our system with the
    // debit information and we should attempt to update our system again.
    checkForExistingDebit(order, function (error, debit) {
      // attempt to process this from the queue again later
      if (error) {
        logger.error('checkForExistingDebit - attempt to process this from the queue again later', { error: error });
        return callback(error);
      }

      if (debit) {
        logger.info('found existing debit for order: ' + order.id, { order: order });
        return (new models.Order(order)).setPaymentPaid('debit', debit, function (error) {
          if (error) return logger.create('DB').error({error: error}), callback(error);
          utils.queues.debit.del(message.id, utils.noop);
          callback();
        });
      }

      // if no debit then continue to process

      // if the status is processing there is no need to set the payment status to processing again
      if (order.payment_status != 'processing') {
        var $update = { payment_status: 'processing' };
        db.orders.update( order.id, $update, d.bind(function(error) {
          if (error) return logger.create('DB').error({error: error}), callback(error);
          debitCustomer(order, function (error) {
            utils.queues.debit.del(message.id, utils.noop);
            if (error) logger.create('DB').error({error: error});
            return callback(error);
          });
        }));
      } else {
        debitCustomer(order, function (error) {
          utils.queues.debit.del(message.id, utils.noop);
          if (error) logger.error({error: error});
          return callback(error);
        });
      }
    });
  }));
};

var worker = function (message, callback) {
  var d = domain.create();
  d.uuid = utils.uuid.v4();
  d.logger = logger.create({ data: { uuid: d.uuid } });
  d.on('error', function (error) {
    logger.error('Domain error', { error: error });
    callback(error);
  });
  d.run(function () {
    task(message, callback);
  });
};

var done = function (error) {
  if (!error) return;
  logger.error({ error: error });
  utils.rollbar.reportMessage(error);
};

var q = utils.async.queue(worker, 5);

setInterval(function () {
  if (q.length() > 5) return; // don't poll ironMQ unless we are running out of work

  utils.queues.debit.get({
    n: 25 // pull 25 items off the queue
  , timeout: 300 // allow up to 5 minutes for processing before putting it back onto the queue
  }, function (error, messages) {
    if (error) return logger.error({error: error}), utils.rollbar.reportMessage(error);
    _.each(messages, function (m) {
      q.push(m, done);
    });
  });
}, config.workers.debit.process.interval);
