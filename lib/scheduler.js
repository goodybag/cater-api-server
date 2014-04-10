var db = require('../db');
var events = require('events');
var util = require('util');

var Scheduler = function() {
  events.EventEmitter.call(this);
};

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
      this_.emit(action, job);
    });
  });

  return this;
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

module.exports = Scheduler;
