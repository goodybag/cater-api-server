var config  = require('../../../config');
var slogger = require('../logger');
var notifier = require('../../../lib/order-notifier');

module.exports.fn = function(job, done) {
  var logger = slogger.create('Send Notification', {
    data: job
  });
  logger.info('Sending');
  notifier.send( job.data.notification_id, job.data.order_id, job.data, done );
}

module.exports.name = 'send-order-notification';
