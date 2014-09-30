var config  = require('../../../config');
var slogger = require('../logger');
var notifier = require('../../../lib/order-notifier');

module.exports = function(job, done) {
  var logger = slogger.create('Send SMS', {
    data: job
  });
  logger.info('Sending');
  notifier.send( 'restaurant-order-submitted-sms', job.data.order_id, done );
  // twilio.sendSms(job.data, function(error) {
  //   if ( error ) {
  //     logger.error('Error sending sms', { error: error });
  //   }
  //
  //   done(error);
  // });
}
