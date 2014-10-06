var config  = require('../../../config');
var slogger = require('../logger');
var notifier = require('../../../lib/order-notifier');

module.exports = function(job, done) {
  var logger = slogger.create('Send Notification', {
    data: job
  });
  logger.info('Sending');
  notifier.send( job.data.notification_id, job.data.order_id, done );
}
