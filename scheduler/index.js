var db = require('../db');
var utils = require('../utils');
var logger = require('../logger').scheduler;

var scheduler = {
  queue: function(action, datetime, data, callback) {
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
  },


  work: function(action, consume, callback) {
    // fetch actions not pending
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

    db.query2(query, function(error, results) {
      if ( error ) return callback( error );

      var jobs = results.map(function(job) {
        return function(done) {
          utils.async.series([
            changeStatus('in-progress', job)
          , consume.bind(this, job)
          ], completeJob.bind(this, done, job) );
        };
      });

      // Run these jobs in parallel
      utils.async.parallelNoBail(jobs, callback);
    });
  }
};

/**
 * @param {String} job status
 * @param {object} the job record
 * @return {Function} returns async.series fn
 */
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

/**
 * This updates the job status 'failed' or 'complete'
 */
var completeJob = function( done, job, error, results ){
  if (error) {
    logger.info('Scheduled job failed', job);
  }
  changeStatus(error ? 'failed' : 'completed', job)(function(){
    return done(error, results);
  });
};

module.exports = scheduler;
