var domain = require('domain');
var utils = require('../../utils');
var logger = require('../../logger');
var models = require('../../models');

var _ = utils._;

var checkForExistingDebit = function (order, callback) {
  var TAGS = [process.domain.uuid];
  utils.balanced.Debits.list({'meta.order_id': order.attributes.id}, function (error, debits) {
    if (error) return callback(error);

    if (debits && debits.total > 1) return callback(new Error('multiple debits for a single order'));
    if (debits && debits.total == 1) callback (null, debits.items[0]);
    return callback(null, null);
  });
}

var debitCustomer = function (order, callback) {
  var TAGS = [process.domain.uuid];

  var amount = Math.floor(order.attributes.total);
  if (typeof amount === 'undefined' || amount == null || amount == 0) return callback(new Error('invalid amount: ' + amount));
  utils.balanced.Debits.create({
    amount: amount
  , customer_uri: order.attributes.user.balanced_customer_uri
  , on_behalf_of_uri: order.attributes.restaurant.balanced_customer_uri
  , appears_on_statement_as: 'GB ORDER #'+ order.attributes.id
  , meta: { // note, cannot search on nested properties so keep searchable properties top-level
      user_id: order.attributes.user.id
    , restaurant_id: order.attributes.restaurant.id
    , order_id: order.attributes.id
    }
  }, function (error, debit) {
    if (error) return order.setPaymentError(error.uri, error, callback);
    return order.setPaymentPaid('debit', debit.uri, debit, callback);
  });
};

var task = function (message, callback) {
  var TAGS = [process.domain.uuid, 'worker-debit-task'];
  if (!message) return callback();

  // if data is bad remove it from the queue immediately
  try {
    var body = JSON.parse(message.body);
  } catch (e) {
    logger.debit.error(TAGS, 'unable to parse message body: ' + message.body);
    return utils.queues.debit.del(message.id, utils.noop), callback(e);
  }

  models.Order.findOne({id: body.order.id}, function (error, order) {
    if (error) return logger.db.error(TAGS, error), utils.rollbar.reportMessage(error), callback(error);

    if(!order) return utils.queues.debit.del(message.id, utils.noop), callback();
    if (_.contains(['invoiced', 'paid'], order.payment_status)) return utils.queues.debit.del(message.id, utils.noop), callback();

    // check to see if a debit was already successfuly processed for this order
    // if so it means that there was an error in updating our system with the
    // debit information and we should attempt to update our system again.
    checkForExistingDebit(order, function (error, debit) {
      if (error) return callback(error); // attempt to process this from the queue again later

      if (debit) {
        logger.debit.info(TAGS, 'found existing debit for order: ' + order.attributes.id);
        return order.setPaymentPaid('debit', debit.uri, debit, callback);
      }

      // if no debit then continue to process

      // if the status is processing there is no need to set the payment status to processing again
      if (order.attributes.payment_status != 'processing') {
        order.attributes.payment_status = 'processing';
        order.save(function (error) {
          if (error) return logger.db.error(TAGS, error), utils.rollbar.reportMessage(error), callback(error);
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