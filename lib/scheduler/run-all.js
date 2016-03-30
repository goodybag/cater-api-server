var db = require('../../db');
var utils = require('../../utils');
var eachJob = require('./each-job');
var createStats = require('./create-stats');
var logger = require('./logger');

var complete = function(callback) {
  return function( error, jobs ) {
    var stats = createStats();

    if ( error ) {
      logger.error('Unable to start jobs', error);
      return callback(error, stats);
    }
    utils.async.each(jobs || [], eachJob(stats), function(err) {
      if ( err ) console.log('Async each error', err);
      callback(null, stats);
    });
  };
};

module.exports = function runAll(opts, callback) {
  if ( typeof opts === 'function' ){
    callback = opts;
    opts = null;
  }

  opts = opts || {};

  var $query = {
    id: '$sj.id$'
  };

  var $update = { status: 'in-progress' };
  var $options = {
    from: {
      type: 'select'
    , alias: 'sj'
    , columns: ['id']
    , table: 'scheduled_jobs'
    , where: {
        status: 'pending'
      , datetime: { $lt: 'now()' }
      , $custom: ['pg_try_advisory_xact_lock(id)']
      }
    , for: { type: 'update' }
    , limit: opts.limit || 4
    }
  , returning: ['*']
  };

  db.scheduled_jobs.update($query, $update, $options, function ( error, jobs ) {
    var stats = createStats();

    if ( error ) {
      logger.error('Unable to start jobs', error);
      return callback(error, stats);
    }

    utils.async.each(jobs || [], eachJob(stats), function ( error ) {
      if ( error ) console.log('Async each error', error);

      callback(null, stats);
    });
  });

};
