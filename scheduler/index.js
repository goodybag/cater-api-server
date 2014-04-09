var db = require('../db');
var utils = require('../utils');

var scheduler = {
  queue: function(action, data, callback) {
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
      }
    };
    db.query2(query, function(error){
      callback && callback(error);
    });
  },


  work: function(action, consume, callback) {
    // fetch actions not pending
    var query = {
      type: 'select'
    , table: 'scheduled_jobs'
    , where: {
        action: action
      , status: 'pending'
      }
    };

    db.query2(query, function(error, results) {
      if ( error ) return callback( error );

      var jobs = results.map(function(job) {
        return function(seriesDone) {
          utils.async.series([
            changeStatus('in-progress', job)
          , consume.bind(this, job)
          , changeStatus('completed', job)
          ], seriesDone);
        };
      });

      // Run these jobs in parallel
      utils.async.parallelNoBail(jobs, callback);
    });
  }
};

var changeStatus = function(status, job) {
  return function(next) {
    var query = {
      type: 'update'
    , table: 'scheduled_jobs'
    , values: { status: status }
    , where: { id: job.id }
    };
    db.query2(query, next);
  };
};
module.exports = scheduler;
