var domain = require('domain');
var config = require('../../config');
var utils = require('../../utils');
var logger = require('./logger').create('Enqueue');
var models = require('../../models');

var _ = utils._;

var task = function () {
  models.Order.findReadyForCharging(1000, function (error, orders) {
    if (error){
      logger.create('DB').error("failed to get orders", { error: error });
      return utils.rollbar.reportMessage(error);
    }
    var messages = [];
    var ids = [];

    _.map(orders, function (order) {
      logger.info('queuing order: '+ order.attributes.id +' for payment processing', { order: order });
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
        logger.error('failed to put orders onto debit queue', { error: error });
        return utils.rollbar.reportMessage(error);
      }
      models.Order.setPaymentStatusPendingIfNull(ids, function (error) {
        if (error){
          utils.rollbar.reportMessage(error);
          return logger.create('DB').error("failed to set orders to pending", { error: error });
        }
      });
    });
  });
};

var done = function (error) {
  if (!error) return;
  logger.error({ error: error });
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
