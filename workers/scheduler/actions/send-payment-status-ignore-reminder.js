var config  = require('../../../config');
var slogger = require('../logger');
var notifier = require('../../../lib/order-notifier');
var db = require('../../../db');

module.exports.fn = function(job, done) {
  var logger = slogger.create('Remind GB Payment Status is Ignore', {
    data: job
  });

  db.orders.findOne(job.data.orderId, function (error, order) {
    if ( error ) {
      logger.error('Could not find order ', error);
      return done (error);
    }

    if (order.payment_status === 'ignore') {
      logger.info('Sending payment status is ignore reminder');
      return notifier.send( job.data.notification_id, job.data.order_id, job.data, done );
    }
    return done();
  });
};

module.exports.name = 'send-payment-status-ignore-reminder';