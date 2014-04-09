var
  config = require('../config')
, scheduler = require('../scheduler')
, twilio = require('twilio')(config.twilio.account, config.twilio.token)
, moment = require('moment')
;

// Run all pending `test` jobs
var makeCall = function(job, done) {
  var deliverAt = moment(job.data.deliverAt);
  delete job.data.deliverAt;

  if ( deliverAt <= moment() ) {
    return twilio.makeCall(job.data, done);
  } else {
    // leave pending ??
    done('call not ready until ' + deliverAt.toString());
  }

  done();
}

var done = function(error, results) {
  if (error) {
    console.log ('couldnt finish test job ' + JSON.stringify(error));
    process.exit(1);
  }
  console.log('Completed ' + results.length + ' "test" jobs');
  process.exit(0);
}

scheduler.work('make-call', makeCall, done);
