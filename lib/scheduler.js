var db = require('../db');
var events = require('events');
var util = require('util');
var logger = require('../logger').scheduler;

function Scheduler() {
  events.EventEmitter.call(this);
  this.actions = [];
}

util.inherits(Scheduler, events.EventEmitter);

Scheduler.prototype.queue = function(action, datetime, data, callback) {
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

Scheduler.prototype.run = function(action) {
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
      this_.emit( options.action, options.job, done.bind(this_, options) );
    }
  });
};

scheduler.on('change-status', changeStatus);

module.exports = scheduler;
