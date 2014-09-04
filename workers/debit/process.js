var domain = require('domain');
var utils = require('../../utils');
var logger = require('../../logger');
var models = require('../../models');
var db = require('../../db');
var _ = utils._;

var checkForExistingDebit = function (order, callback) {
  var TAGS = [process.domain.uuid];
  utils.balanced.Debits.list({'meta.order_uuid': order.uuid}, function (error, debits) {
    if (error) return callback(error);

    if (debits && debits.total > 1) return callback(new Error('multiple debits for a single order: ' + order.id));
    if (debits && debits.total == 1) return callback (null, debits.items[0]);
    return callback(null, null);
  });
}

var debitCustomer = function (order, callback) {
  var TAGS = [process.domain.uuid];

  var amount = Math.floor(order.total);
  if (typeof amount === 'undefined' || amount == null || amount == 0) return callback(new Error('invalid amount: ' + amount));

  var pmId = order.payment_method_id;
  models.PaymentMethod.findOne(pmId, function(error, paymentMethod) {
    if (error) return callback(new Error('invalid payment method: ' + pmId));
      utils.balanced.Debits.create({
        amount: amount
      , source_uri: paymentMethod.attributes.uri
      , customer_uri: order.user.balanced_customer_uri
      , on_behalf_of_uri: order.restaurant.balanced_customer_uri
      , appears_on_statement_as: 'GB ORDER #'+ order.id
      , meta: { // note, cannot search on nested properties so keep searchable properties top-level
          user_id: order.user.id
        , restaurant_id: order.restaurant.id
        , order_id: order.id
        , order_uuid: order.uuid
        }
      }, function (error, debit) {
        // construct a model to run the following transactions
        if (error) return (new models.Order(order)).setPaymentError(error.uri, error, callback);
        return (new models.Order(order)).setPaymentPaid('debit', debit.uri, debit, callback);
      });
  });
};

var task = function (message, callback) {
  var TAGS = [process.domain.uuid, 'worker-debit-process-task'];
  if (!message) return callback();

  // if data is bad remove it from the queue immediately
  try {
    var body = JSON.parse(message.body);
  } catch (e) {
    logger.debit.error(TAGS, 'unable to parse message body: ' + message.body);
    return utils.queues.debit.del(message.id, utils.noop), callback(e);
  }

  logger.debit.info("processing order: " + body.order.id);

  var $options = { 
    one: [ 
      { table: 'restaurants', alias: 'restaurant' }
    , { table: 'users', alias: 'user' }
    ]
  };
  db.orders.findOne( body.order.id, $options, function(error, order) {
    if ( error ) return logger.db.error(TAGS, error), callback(error);
    if ( !order ) return utils.queues.debit.del(message.id, utils.noop), callback();
    if (_.contains(['invoiced', 'paid', 'ignore'], order.payment_status)) return utils.queues.debit.del(message.id, utils.noop), callback();

    // check to see if a debit was already successfuly processed for this order
    // if so it means that there was an error in updating our system with the
    // debit information and we should attempt to update our system again.
    checkForExistingDebit(order, function (error, debit) {
      if (error) return callback(error); // attempt to process this from the queue again later

      if (debit) {
        logger.debit.info(TAGS, 'found existing debit for order: ' + order.id);
        return (new models.Order(order)).setPaymentPaid('debit', debit.uri, debit, function (error) {
          if (error) return logger.db.error(TAGS, error), callback(error);
          utils.queues.debit.del(message.id, utils.noop);
          callback();
        });
      }

      // if no debit then continue to process

      // if the status is processing there is no need to set the payment status to processing again
      if (order.payment_status != 'processing') {
        var $update = { payment_status: 'processing' };
        db.orders.update( order.id, $update, function(error) {
          if (error) return logger.db.error(TAGS, error), callback(error);
          debitCustomer(order, function (error) {
            utils.queues.debit.del(message.id, utils.noop);
            if (error) logger.debit.error(TAGS, error);
            return callback(error);
          });
        });
      } else {
        debitCustomer(order, function (error) {
          utils.queues.debit.del(message.id, utils.noop);
          if (error) logger.debit.error(TAGS, error);
          return callback(error);
        });
      }
    });
  });
};

var worker = function (message, callback) {
  var d = domain.create();
  d.uuid = utils.uuid.v4();
  d.on('error', function (error) {
    callback(error);
  });
  d.run(function () {
    task(message, callback);
  });
};

var done = function (error) {
  if (!error) return;
  console.log(error);
  console.log(error.stack);
  utils.rollbar.reportMessage(error);
};

var q = utils.async.queue(worker, 5);

setInterval(function () {
  if (q.length() > 5) return; // don't poll ironMQ unless we are running out of work

  utils.queues.debit.get({
    n: 25 // pull 25 items off the queue
  , timeout: 300 // allow up to 5 minutes for processing before putting it back onto the queue
  }, function (error, messages) {
    if (error) return logger.debit.error(['iron-mq-poller'], error), utils.rollbar.reportMessage(error);
    _.each(messages, function (m) {
      q.push(m, done);
    });
  });
}, 1000);
