var config = require('../../config');
var twilio = require('twilio')(config.twilio.account, config.twilio.token);
var Scheduler = require('../../lib/scheduler');
var scheduler = new Scheduler();
var logger = require('../../logger').scheduler;

scheduler.on('make-call', function(job) {
  scheduler.changeJobStatus('in-progress', job, function(err) {
    if ( err) return logger.error('Could not change job status to in-progress', job);
    logger.info('Updated job status to in-progress', job);

    twilio.makeCall(job.data, function(error) {
      if (error) {
        logger.error('Could not place call', error);
      }

      scheduler.changeJobStatus(error ? 'failed' : 'completed', job, function(error2){
        console.log( 'make-call job #' + job.id + ' ' + (error ? 'failed' : 'completed') );
      });
    });
  });
});

// Add scheduled actions here and register listener above
var actions = [
  'make-call'
];

actions.forEach(function(action) {
  console.log('Running ' + action + ' jobs');
  scheduler.run.call(scheduler, action);
});
