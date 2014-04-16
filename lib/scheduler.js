var db = require('../db');
var utils = require('../utils');
var logger = require('../logger').scheduler;
var reporter = require('./stats-reporter');

function Scheduler() {
  this.actions = {};
}

/**
 * Schedules a new job
 *
 * @param {string}   action
 * @param {Date}     datetime to run job by
 * @param {object}   data for consumers
 * @param {function} callback(err, result)
 */
Scheduler.prototype.enqueue = function(action, datetime, data, callback) {
  if ( typeof action !== 'string') {
    callback && callback('Invalid action type: ' + typeof action);
  }
  var query = {
    type: 'insert'
  , table: 'scheduled_jobs'
  , values: {
      action: action
    , data: data
    , status: 'pending'
    , datetime: datetime
    }
  , returning: ['*']
  };
  db.query2(query, function(error, result){
    callback && callback(error, Array.isArray(result) ? result[0] : null);
  });
  return this;
};

/**
 * Updates job status and stats
 */
Scheduler.prototype.changeStatus = function(job, status, done) {
  db.scheduled_jobs.update(
    { status: 'in-progress', id: job.id }
  , { status: status }
  , { returning: ['*'] }
  , function( error, jobs ) {
      if ( error ) logger.error('Unable to change status', error);
      // don't pass error to done
      // otherwise the async.each will terminate prematurely
      done(); 
  });
};

/**
 * Run a single job
 * @param  {object}     stats object
 * @return {function}   function(job, done)
 */
Scheduler.prototype.eachJob = function(stats) {
  var this_ = this;
  return function(job, done) {
    if ( job.action in this_.actions ) {
      var fn = this_.actions[job.action];
      stats[job.action].started.value++;
      fn(job, function(error) {
        var status = error ? 'failed': 'completed';
        stats[job.action][status].value++;
        this_.changeStatus(job, status, done);
      }); 
    } else {
      stats.other.unregistered.value++;
      logger.error('Unregistered action: ' + job.action);
      this_.changeStatus(job, 'failed', done);
    }
  };
}

/**
 * Run all pending jobs in parallel
 * @param {function} callback(errors, stats)
 */
Scheduler.prototype.runAll = function(callback) {
  var this_ = this;
  db.scheduled_jobs.update(
    { status: 'pending', datetime: { $lt: 'now()' } }
  , { status: 'in-progress' }
  , { returning: ['*'] }
  , function( error, jobs ) {
      var stats = this_.createStats();

      if ( error ) {
        logger.error('Unable to start jobs', error);
        return callback(error, stats);
      }

      utils.async.each(jobs, this_.eachJob(stats), function(err) {
        callback(null, stats);
      });
  });
};

Scheduler.prototype.createStats = function() {
  var stats = Object.keys(this.actions).reduce(function(memo, action) {
    memo[action] = reporter.createStatsGroup({
        started:     'Jobs Started'
      , completed:   'Jobs Completed'
      , failed:      'Jobs Failed'
    });
    return memo;
  }, {});

  stats.other = reporter.createStatsGroup({
    unregistered:    'Jobs with unregistered action'
  });

  return stats;
};

/**
 * Attach work function to action
 * @param {string}   action
 * @param {function} fn(job, done)
 */
Scheduler.prototype.registerAction = function(action, fn) {
  if ( this.actions[action] ){
    return logger.error( 'Already registered action: ' + action );
  }
  this.actions[action] = fn;
};

/**
 * Expose a single instance
 */
var scheduler = new Scheduler();
module.exports = scheduler;
