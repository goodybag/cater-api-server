var config  = require('../../../config');
var twilio  = require('twilio')(config.twilio.account, config.twilio.token);
var slogger = require('../logger');

module.exports = function(job, done) {
  var logger = slogger.create('MakeCall', {
    data: { job: job }
  });

  logger.info('Making call');

  twilio.makeCall(job.data, function(error) {
    if (error) {
      logger.error('Could not place call', { error: error });
    }
    done(error);
  });
};
