var config = require('../../config');
var twilio = require('twilio')(config.twilio.account, config.twilio.token);
var scheduler = require('../../lib/scheduler');
var logger = require('../../logger').scheduler;

scheduler.registerAction('make-call', function(job, done) {
  twilio.makeCall(job.data, function(error) {
    if (error) {
      logger.error('Could not place call for job #' + job.id, error);
      done('failed');
    } else {
      logger.info('Made call successfully', job);
      done('completed');
    }
  });
});

module.exports = scheduler.actions;
