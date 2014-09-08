var config  = require('../../../config');
var twilio  = require('twilio')(config.twilio.account, config.twilio.token);
var slogger = require('../logger');

module.exports = function(job, done) {
  var logger = slogger.create('Send SMS', {
    data: { job: job }
  });

  logger.info('Sending');

  twilio.sendSms(job.data, function(error) {
    if ( error ) {
      logger.error('Error sending sms', { error: error });
    }

    done(error);
  });
}
