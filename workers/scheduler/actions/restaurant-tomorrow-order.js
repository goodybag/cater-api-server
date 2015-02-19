var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../logger');
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');

require('../../../lib/order-notifications');

/**
 * Reminds restaurant of upcoming orders
 * Note: Ensure orders are still 'accepted' when sending
 */

module.exports.fn = function(job, done) {
  var logger = slogger.create('Remind Restaurant of upcoming order', {
    data: job
  });

  var orderId = job.data.orderId;

  logger.info('Sending delivery service order submitted notification');

  utils.async.parallel([
    notifier.send.bind( notifier, 'restaurant-tomorrow-order', orderId )
    ], done );
  };

  module.exports.name = 'restaurant-tomorrow-order';
