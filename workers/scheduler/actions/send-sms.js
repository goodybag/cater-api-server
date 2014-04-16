var config = require('../../../config');
var twilio = require('twilio')(config.twilio.account, config.twilio.token);
var logger = require('../../../logger').scheduler;

module.exports = function(job, done) {
  twilio.sendSms(job.data, function(error) {
    if ( error ) {
      logger.error('Could not send sms for job #' + job.id, error);
    }
    done(error);
  });
}
