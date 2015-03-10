var actions = require('./actions');
var changeStatus = require('./change-status');
var logger = require('./logger');

module.exports = function work(task, callback) {
  // callback completes async.q worker
  // done completes async.eachJob
  var job = task.job;
  var done = task.done;
  var stats = task.stats;
  var tx = task.tx;
  var change = changeStatus(tx);

  if ( job.action in actions ) {
    var fn = actions[job.action];
    stats[job.action].started.value++;
    // logger.info('Starting job', job);
    fn(job, function(error) {
      // logger.info('Job completed', job);
      if ( error ){
        logger.error( 'Job error!', { error: error, job: job } );
      }
      var status = error ? 'failed': 'completed';
      stats[job.action][status].value++;
      change(job, status, function() {
        done();
        callback(null);
      });
    });
  } else {
    stats.other.unregistered.value++;
    logger.error('Unregistered action: ' + job.action);
    change(job, 'failed', function() {
      done();
      callback(null);
    });
  }
};
