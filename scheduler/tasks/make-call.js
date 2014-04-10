var
  config = require('../../config')
, scheduler = require('../../scheduler')
, twilio = require('twilio')(config.twilio.account, config.twilio.token)
, moment = require('moment')
;

// Run against all pending `test` jobs
// done(error) will update job status 'failed'
// done(null) for 'completed'
var makeCall = function(job, done) {
  return twilio.makeCall(job.data, done);
};

var done = function(error, results) {
  console.log('completed ' + results.length + ' "make-call" jobs');
  process.exit(error ? 1 : 0);
};

scheduler.work('make-call', makeCall, done);
