var config = require('../../../config');
var twilio = require('twilio')(config.twilio.account, config.twilio.token);
var logger = require('../../../logger').scheduler;

module.exports = function(job, done) {
  twilio.makeCall(job.data, function(error) {
    if (error) {
      logger.error('Could not place call for job #' + job.id, error);
    }
    done(error);
  });
};
