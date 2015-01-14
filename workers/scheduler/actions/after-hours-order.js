var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../logger');
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');

require('../../../lib/order-notifications');

module.exports.fn = function(job, done) {
  var logger = slogger.create('Notify CS of after hours orders', {
    data: job
  });

  var orderId = job.data.orderId;

  logger.info('Sending CS after hours notifications');

  utils.async.parallel([
    notifier.send.bind( notifier, 'gb-after-hours-order-email', orderId )
  , notifier.send.bind( notifier, 'gb-after-hours-order-sms', orderId )
  ], done );
};

module.exports.name = 'after-hours-order';
