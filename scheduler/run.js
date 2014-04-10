var
  config = require('../config')
, scheduler = require('../scheduler')
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
  if (error) {
    console.log('one or more jobs failed');
    process.exit(1);
  }
  console.log('Completed ' + results.length + ' "make-call" jobs');
  process.exit(0);
};

scheduler.work('make-call', makeCall, done);
