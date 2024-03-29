var actions = require('./actions');
var changeStatus = require('./change-status');
var logger = require('./logger');

module.exports = function work(task, callback) {
  // callback completes async.q worker
  // done completes async.eachJob
  var job = task.job;
  var done = task.done;
  var stats = task.stats;

  var limit = 30 * 1000; // 30 seconds

  if ( job.action in actions ) {
    var fn = actions[job.action];
    stats[job.action].started.value++;
    var timeout;

    try {
      logger.info('Trying job#', job.id);

      timeout = setTimeout(function () {
        logger.error('Job #'+ job.id+' Timeout!', {
          id: job.id
        , data: job.data
        , action: job.action
        });
        var status = 'failed';
        stats[job.action].failed.value++;
        changeStatus(job, status, function() {
          done();
          callback(null);
        });
      }, limit);

      fn(job, function(error) {
        if ( error ){
          // TODO fix error serialization upstream
          logger.error( 'Job error!', { error: JSON.stringify(error, Object.getOwnPropertyNames(error)), job: job } );
        }
        var status = error ? 'failed': 'completed';
        stats[job.action][status].value++;
        changeStatus(job, status, function() {
          clearTimeout(timeout);
          done();
          callback(null);
        });
      });
    } catch (error) {
      // TODO fix error serialization upstream
      logger.error('Job exception thrown!', { error: JSON.stringify(error, Object.getOwnPropertyNames(error)), job: job } );
      var status = 'failed';
      stats[job.action].failed.value++;
      changeStatus(job, status, function() {
        if (timeout) {
          clearTimeout(timeout);
        }
        done();
        callback(null);
      });
    }
  } else {
    stats.other.unregistered.value++;
    logger.error('Unregistered action: ' + job.action);
    changeStatus(job, 'failed', function() {
      done();
      callback(null);
    });
  }
};
