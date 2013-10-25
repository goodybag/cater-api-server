var worker = require('../worker');
var utils = require('../../utils');
var logger = require('../../logger');
var models = require('../../models');

var _ = utils._;

/**
 * Take an order that is pending payment and start processing that order for payment
 */

var done = function (error) {
  if (!error) return;
  console.log(error);
  console.log(error.stack);
  utils.rollbar.reportMessage(error);
};

var job = function (callback) {

  var debitCustomer = function (order, user, restaurant) {
    var amount = (order.attributes.total/100).toFixed(2);
    utils.balanced.Debits.create({
      amount: amount
    , customer_uri: user.balanced_customer_uri
    , on_behalf_of_uri: restaurant.balanced_customer_uri
    , meta: {
        user: {id: order.attributes.user.id}
      , restaurant: {id: order.attributes.restaurant.id}
      , order: {id: order.attributes.id}
      }
    }, function (error, debit){
      // update order and save to transactions in one go if no error
      // if error, set payment status to error and save to transaction errors
    });
  };

  utils.queues.debit.get({
    timeout: 300 // allow up to 5 minutes for processing before putting it back onto the queue
  }, function (error, message) {
    var TAGS = [utils.uuid.v4()];

    if (error) return logger.debit.error(TAGS, error), utils.rollbar.reportMessage(error), callback();
    if (!message) return callback();

    // if data is bad remove it from the queue immediately
    try {
      var body = JSON.parse(message.body);
    } catch (e) {
      return utils.queue.debit.del(message.id), callback();
    }

    models.Order.findOne({id: body.order.id}, function (error, order) {
      if (error) return logger.db.error(TAGS, error), utils.rollbar.reportMessage(error), callback();

      if(!order) return utils.queue.debit.del(message.id), callback();
      if (_.contains(['invoiced', 'paid'], order.payment_status)) return utils.queue.debit.del(message.id), callback();

      // if the status is processing there is no need to set the payment status to processing again
      if (order.payment_status != 'processing') {
        order.attributes.payment_status = 'processing';
        order.save(function (error) {
          if (error) return logger.db.error(TAGS, error), utils.rollbar.reportMessage(error), callback();
          var amount = (order.attributes.total/100).toFixed(2);
        });
      }
    });
  });
};

worker.forever(5, job, done);