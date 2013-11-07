var domain = require('domain');
var config = require('../../config');
var utils = require('../../utils');
var logger = require('../../logger');
var models = require('../../models');

var _ = utils._;

var task = function () {
  var TAGS = ['worker-debit-enqueue-task'];
  models.Order.findReadyForCharging(1000, function (error, orders) {
    if (error) return logger.db.error(TAGS, "failed to get orders", error), utils.rollbar.reportMessage(error);
    var messages = [];
    var ids = [];

    _.map(orders, function (order) {
      logger.debit.info(TAGS, 'queuing order: '+ order.attributes.id +' for payment processing');
      ids.push(order.attributes.id);
      messages.push({
        body: JSON.stringify({order: {id: order.attributes.id}})
      , delay: 5 // delay because we ideally want the database update to finish before we start processing
      , expires_in: 2592000 // 30 days
      });
    });

    if (messages.length == 0) return;
    utils.queues.debit.post(messages, function (error, body) {
      if (error) {
        // it's alright if we have an error, we'll get these orders on the next go;
        return logger.debit.error(TAGS, 'failed to put orders onto debit queue', error), utils.rollbar.reportMessage(error);
      }
      models.Order.setPaymentStatusPendingIfNull(ids, function (error) {
        if (error) return logger.db.error(TAGS, "failed to set orders to pending", error), utils.rollbar.reportMessage(error);
      });
    });
  });
};

var done = function (error) {
  if (!error) return;
  console.log(error);
  console.log(error.stack);
  utils.rollbar.reportMessage(error);
};

var worker = function () {
  var d = domain.create();
  d.on('error', done);
  d.run(task);
};

worker();
setInterval(function() {
  worker();
}, config.workers.debit.enqueue.interval); // check for orders that need queueing every 30 minutes