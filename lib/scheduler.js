var db = require('../db');
var events = require('events');
var util = require('util');
var utils = require('../utils');
var logger = require('../logger').scheduler;
var reporter = require('./stats-reporter');

function Scheduler() {
  events.EventEmitter.call(this);
  this.actions = [];
}

util.inherits(Scheduler, events.EventEmitter);

/**
 * Schedules a new job
 *
 * @param {string} action
 * @param {Date} datetime to run job by
 * @param {object} data for consumers
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
 * This wraps up a single job per action and updates its final status
 *
 * @param {object} job data
 * @param {function} done is the async.parallel callback
 * @param {object} stats
 */
Scheduler.prototype.completeJob = function(job, done, stats) {
  var this_ = this;
  return function(error) {
    var complete = this_.changeStatus(job, stats, error ? 'failed' : 'completed');
    complete(done);
  };
};

/**
 * Updates job statuses and stats
 */
Scheduler.prototype.changeStatus = function(job, stats, status) {
  return function(next) {
    var query = {
      type: 'update'
    , table: 'scheduled_jobs'
    , values: {
        status: status
      }
    , where: {
        id: job.id
      }
    };

    switch(status) {
      case 'in-progress':
        stats.started.value++;
        break;
      case 'completed':
        stats.completed.value++;
        break;
      case 'failed':
        stats.failed.value++;
        break;
    }

    db.query2(query, function( error, results) {
      next( error );
    });
  };
};

var runListeners = function(action, job) {
  var listeners = this.listeners(action)[0];
  return function(next) {
    listeners(job, next);
  };
};

// Return an async.parallel task that will do:
// 1. update status in-progress
// 2. work on job
// 3. update status complete or failed
// 4. callback with final status
Scheduler.prototype.setupJob = function(action, stats, job) {
  var this_ = this;
  var listenerDone = this.changeStatus(job, stats);

  // the done callback is to complete this parallel fn
  return function(done) {
    utils.async.series([
      this_.changeStatus(job, stats, 'in-progress')
    , runListeners.call(this_, action, job, listenerDone)
    ], this_.completeJob(job, done, stats) );
  };
};

Scheduler.prototype.runJobsParallel = function(jobs, action, stats, callback) {
  // partially apply actions & stats
  jobs = jobs.map(this.setupJob.bind(this, action, stats));
  utils.async.parallelNoBail(jobs, function(err, results) {
    callback(err, stats);
  });
};

/**
 * Run all pending jobs of a given action
 *
 * @param {string} action
 * @param {function} callback(error, stats)
 */
Scheduler.prototype.run = function(action, callback) {
  var this_ = this;
  var query = {
    type: 'select'
  , table: 'scheduled_jobs'
  , where: {
      action: action
    , status: 'pending'
    , $lte: {
        datetime: 'now()'
      }
    }
  };

  var stats = reporter.createStatsGroup({
    started:     'Jobs Started'
  , completed:   'Jobs Completed'
  , failed:      'Jobs Failed'
  });

  db.query2(query, function(error, jobs) {
    if (error) return callback(error);
    this_.runJobsParallel(jobs, action, stats, callback);
  });
};

// This code is really crazy
Scheduler.prototype.runAll = function(callback) {
  var this_ = this;
  var tasks = this.actions.reduce(function(memo, action) {
    memo[action] = function(done) {
      this_.run(action, done);
    };
    return memo;
  }, {});
  utils.async.parallelNoBail(tasks, callback);
};

/**
 * Attach work function to action
 * @param {string} action
 * @param {function} listener(job, done)
 */
Scheduler.prototype.registerAction = function(action, listener) {
  if (this.actions.indexOf(action) < 0)
    this.actions.push(action);
  this.on(action, listener);
};

/**
 * Expose a single instance
 */
var scheduler = new Scheduler();
module.exports = scheduler;
