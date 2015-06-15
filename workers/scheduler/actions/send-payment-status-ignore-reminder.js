var config  = require('../../../config');
var slogger = require('../logger');
var notifier = require('../../../lib/order-notifier');
var db = require('../../../db');

module.exports.fn = function(job, done) {
  var logger = slogger.create('StatusIgnoredReminder', {
    data: job
  });

  db.orders.findOne(job.data.order_id, function (error, order) {
    if ( error ) {
      logger.error('Could not find order ', error);
      return done (error);
    }

    if (order.payment_status === 'ignore') {
      logger.info('Sending status ignored reminder');
      return notifier.send( 'gb-payment-status-ignore', order, job.data, done );
    }
    return done();
  });
};

module.exports.name = 'send-payment-status-ignore-reminder';