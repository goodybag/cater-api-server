var db = require('../db');
var utils = require('../utils');
var logger = require('./logger');
var reporter = require('./stats-reporter');

function Scheduler( options ) {
  options = utils.defaults( options || {}, {
    logger: logger.create('Scheduler')
  });

  this.logger = options.logger;
  this.actions = {};
}

Scheduler.prototype.provideLogger = function(logger) {
  this.logger = logger;
  return this;
};

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

  this.logger.info('Enqueue', {
    action:   action
  , data:     data
  , datetime: datetime
  });

  db.query2(query, function(error, result){
    if (error) {
      this.logger.error('Error running enqueue query', error);
    }
    callback && callback(error, Array.isArray(result) ? result[0] : null);
  }.bind(this));
  return this;
};

/**
 * Updates job status and stats
 */
Scheduler.prototype.changeStatus = function(job, status, done) {
  this.logger.info('Updating job status to %s', status, job);

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
  var logger = this.logger;
  return function(job, done) {
    if ( job.action in this_.actions ) {
      var fn = this_.actions[job.action];
      stats[job.action].started.value++;
      logger.info('Starting job', job);
      fn(job, function(error) {
        logger.info('Job completed', job);
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

  var $options = {
    with: [
      { name: 'completed_jobs'
      , type: 'select'
      , table: 'scheduled_jobs'
      , where: { status: 'completed' }
      }
    , { name: 'to_be_updated'
      , type: 'select'
      , table: 'scheduled_jobs'
      , columns: ['id']
      , joins: [
          { type:   'left outer'
          , target: 'completed_jobs'
          , on:     { id: '$scheduled_jobs.predicate_id$' }
          }
        ]
      , where: {
          status: 'pending'
        , datetime: { $lt: 'now()' }
        , predicate_id: {
            $or: { $null: true, $equals: '$completed_jobs.id$' }
          }
        }
      }
    ]
  , returning: ['*']
  };

  db.scheduled_jobs.update(
    { id: { $in: { type: 'select', columns: ['id'], table: 'to_be_updated' } } }
  , { status: 'in-progress' }
  , $options
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
    return this.logger.error( 'Already registered action: ' + action );
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

  this.logger.info('Series', { jobs: jobs });

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
