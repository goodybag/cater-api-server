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
Scheduler.prototype.enqueue = function(action, datetime, data, predicateId, callback) {
  if ( typeof action !== 'string') {
    callback && callback('Invalid action type: ' + typeof action);
  }

  if ( typeof predicateId === 'function' ){
    callback = predicateId;
    predicateId = null;
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

  var $where = {
    status: 'pending'
  , datetime: { $lt: 'now()' }
  , predicate_id: {
      $or: {
        $in: {
          type:     'select'
        , table:    'scheduled_jobs'
        , columns:  ['id']
        , where:    { status: 'completed' }
        }
      , $null: true
      }
    }
  };

  db.scheduled_jobs.update(
    $where
  , { status: 'in-progress' }
  , { returning: ['*'] }
  , function( error, jobs ) {
      var stats = this_.createStats();

      if ( error ) {
        logger.error('Unable to start jobs', error);
        return callback(error, stats);
      }

      utils.async.each(jobs || [], this_.eachJob(stats), function(err) {
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
 * Run multiple jobs one after another
 *
 * @param  {Array} jobs An array of job objects
 */
Scheduler.prototype.series = function(jobs, callback) {
  callback = callback || utils.noop;

  // We need to run these inserts in a transaction, but in order for us
  // to get the id of each result, it's easiest to do this in an anonymous
  // plpgsql code block
  var queryTmpl = function( jobs ){
    return [
      'do $$'
    , '  declare job record;'
    , 'begin'
    , '  ' + insertTmpl( utils.extend( { withoutJob: true }, jobs[0] ) )
    , jobs.slice(1).map( function( job ){
        return '  ' + insertTmpl( job );
      }).join('\n')
    , 'end$$;'
    ].join('\n');
  };

  var insertTmpl = function( data ){
    var insertable = {};
    var values = [];

    var headers = [
      'action'
    , 'datetime'
    , 'data'
    ].filter( function( k ){
      return k in data;
    });

    if ( data.withoutJob !== true ){
      headers.push('predicate_id');
    }

    headers.forEach( function( h ){
      if ( h === 'predicate_id' ){
        values.push('job.id');
      } else if ( h === 'data' ){
        values.push( "'" + JSON.stringify( data[ h ] ) + "'::json" );
      } else {
        values.push( "'" + data[ h ] + "'" );
      }
    });

    return [
      'execute \''
    , 'insert into "scheduled_jobs" '
    , '( "' + headers.join('", "') + '" ) '
    , 'values ( $' + values.map( function( a, i ){ return i + 1; }).join(', $') + ' ) '
    , 'returning *'
    , '\' into job using '
    , values.join(', ')
    , ';'
    ].join('');
  };

  db.query( queryTmpl( jobs ), [], callback );
};

/**
 * Expose a single instance
 */
var scheduler = new Scheduler();
module.exports = scheduler;
