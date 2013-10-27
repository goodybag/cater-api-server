var domain = require('domain');
var utils = require('../../utils');
var logger = require('../../logger');
var models = require('../../models');

var _ = utils._;

var debitCustomer = function (order, user, restaurant, callback) {
  var TAGS = [process.domain.uuid];

  var amount = (order.attributes.total/100).toFixed(2);
  if(typeof amount === 'undefined' || amount == null || amount == 0) return;
  utils.balanced.Debits.create({
    amount: amount
  , customer_uri: user.balanced_customer_uri
  , on_behalf_of_uri: restaurant.balanced_customer_uri
  , meta: {
      user: {id: order.attributes.user.id}
    , restaurant: {id: order.attributes.restaurant.id}
    , order: {id: order.attributes.id}
    }
  }, function (error, debit) {
    if (error) return order.setPaymentError(error.uri, error, callback);
    return order.setPaymentPaid('debit', debit.uri, debit, callback);
  });
};

var task = function (message, callback) {
  var TAGS = [process.domain.uuid];
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

    // if the status is processing there is no need to set the payment status to processing again
    if (order.payment_status != 'processing') {
      order.attributes.payment_status = 'processing';
      order.save(function (error) {
        if (error) return logger.db.error(TAGS, error), utils.rollbar.reportMessage(error), callback(error);
        // debit customer
      });
    } else {
      // debit customer
    }
  });
};

var worker = function(message, callback) {
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