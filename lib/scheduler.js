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

Scheduler.prototype.run = function(action, callback) {
  var this_ = this;
  var stats = {
    started: 0
  , completed: 0
  , failed: 0
  };
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

  db.query2(query, function(error, jobs) {
    if ( error ) return callback( error );
    jobs.forEach(function(job) {
      logger.info('Starting job', job);
      this_.emit('change-status', {
        status: 'in-progress'
      , action: action
      , job: job
      });
    });
  });

  return this;
};

var completeJob = function(job, done, stats) {
  return function(finalStatus) {
    var complete = changeStatus2(job, stats, finalStatus);
    complete(done);
  };
};

var changeStatus2 = function(job, stats, status) {
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

var runListeners = function(action, job, done) {
  var listeners = this.listeners(action)[0];
  return function(next) {
    listeners(job, next);
  };
};

// each job will
// 1. update status in-progress
// 2. work on job
// 3. update status complete or failed
// 4. callback with final status
var setupJob = function(action, stats, job) {
  var this_ = this;
  var listenerDone = changeStatus2.bind(this, job, stats);
  return function(done) {
    utils.async.series([
      changeStatus2(job, stats, 'in-progress')
    , runListeners.call(this_, action, job, listenerDone)
    ], completeJob.call(this_, job, done, stats) );
  }.bind(this);
};

// run all pending jobs in parallel
var runJobs = function(jobs, action, stats, callback) {
  jobs = jobs.map(setupJob.bind(this, action, stats));
  utils.async.parallelNoBail(jobs, function(err, results) {
    callback(err, stats);
  }.bind(this));
};

Scheduler.prototype.run2 = function(action, callback) {
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

    runJobs.call(this, jobs, action, stats, function(error, results) {
      callback(error, stats);
    }.bind(this));

  }.bind(this));
};



Scheduler.prototype.runAll = function() {
  var this_ = this;
  this.actions.forEach(function(action) {
    this_.run(action);
  });
};

Scheduler.prototype.changeJobStatus = function(status, job, callback) {
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

  db.query2(query, callback);
  return this;
};

Scheduler.prototype.registerAction = function(action, listener) {
  if (this.actions.indexOf(action) < 0)
    this.actions.push(action);
  this.on(action, listener);
};

var scheduler = new Scheduler();

var done = function(options, status) {
  options.status = status;
  delete options.action;
  this.emit('change-status', options);
};

var changeStatus = function(options) {
  var this_ = this;

  var query = {
    type: 'update'
  , table: 'scheduled_jobs'
  , values: { status: options.status }
  , where: { id: options.job.id }
  };

  db.query2( query, function( error, result ) {
    if ( error ) {
      return logger.error('Unable to change job status to ' + options.status, error);
    }
    if ( options.action ) {
      options.job.status = options.status;
      this_.emit( options.action, options.job, done.bind(this_, options) );
    }
  });
};

scheduler.on('change-status', changeStatus);

module.exports = scheduler;
