var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../logger');
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');

require('../../../lib/order-notifications');

module.exports.fn = function(job, done) {
  var logger = slogger.create('Notify Delivery Service', {
    data: job
  });

  var orderId = job.data.orderId;

  logger.info('Sending delivery service order submitted notification');

  utils.async.parallel([
    notifier.send.bind( notifier, 'delivery-service-order-submitted', orderId )
  ], done );
};

module.exports.name = 'notify-delivery-service';
