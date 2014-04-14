var db = require('../db');
var events = require('events');
var util = require('util');
var utils = require('../utils');
var logger = require('../logger').scheduler;

function Scheduler() {
  events.EventEmitter.call(this);
  this.actions = [];
}

util.inherits(Scheduler, events.EventEmitter);

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

Scheduler.prototype.completeJob = function(job, done, stats) {
  var this_ = this;
  return function(finalStatus) {
    var complete = this_.changeStatus(job, stats, finalStatus);
    complete(done);
  };
};

// return an async.series fn
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
        stats.started++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'failed':
        stats.failed++;
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

// Return an async.parallel fn that will do:
// 1. update status in-progress
// 2. work on job
// 3. update status complete or failed
// 4. callback with final status
var setupJob = function(action, stats, job) {
  var this_ = this;
  var listenerDone = this.changeStatus(job, stats);

  // the done callback is to complete this parallel fn
  return function(done) {
    utils.async.series([
      this_.changeStatus(job, stats, 'in-progress')
    , runListeners.call(this_, action, job, listenerDone)
    ], this_.completeJob(job, done, stats) );
  }.bind(this);
};

// run jobs in parallel
Scheduler.prototype.runJobs = function(jobs, action, stats, callback) {
  jobs = jobs.map(setupJob.bind(this, action, stats));
  utils.async.parallelNoBail(jobs, function(err, results) {
    callback(err, stats);
  });
};

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
  var stats= {
    started: 0
  , completed: 0
  , failed: 0
  };

  db.query2(query, function(error, jobs) {
    if (error) return callback(error);
    this_.runJobs(jobs, action, stats, callback);
  });
};

Scheduler.prototype.runAll = function() {
  var this_ = this;
  this.actions.forEach(function(action) {
    this_.run(action, function(err, stats) {
      console.log('Action:', action);
      if (err) console.err('Error: ' + err);
      console.log(stats);
    });
  });
};

Scheduler.prototype.registerAction = function(action, listener) {
  if (this.actions.indexOf(action) < 0)
    this.actions.push(action);
  this.on(action, listener);
};

var scheduler = new Scheduler();

module.exports = scheduler;
