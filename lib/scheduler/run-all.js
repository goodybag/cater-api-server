var db = require('db');
var utils = require('utils');
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

  var $query = { id: { $in: { type: 'select', columns: ['id'], table: 'to_be_updated' } } };
  var $update = { status: 'in-progress' };
  var $options = {
    with: [
      { name: 'completed_jobs'
      , type: 'select'
      , table: 'scheduled_jobs'
      , where: { status: 'completed' }
      }
    , { name: 'to_be_updated'
      , type: 'select'
      , for: { type: 'update' }
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
      , limit: opts.limit || 'all'
      , order: opts.order || 'id asc' // fifo
      }
    ]
  , returning: ['*']
  };

  var tx = db.dirac.tx.create();
  utils.async.waterfall([
    function(callback) {
      tx.begin(function(err, res) {
        callback(err);
      });
    }

  // , function(callback) {
  //     tx.scheduled_jobs.lock('ACCESS EXCLUSIVE', function(err, res) {
  //       callback(err);
  //     });
  //   }

  , function(callback) {
      tx.scheduled_jobs.update($query, $update, $options, function( error, jobs ) {
        var stats = createStats();

        if ( error ) {
          logger.error('Unable to start jobs', error);
          return callback(error, stats);
        }

        utils.async.each(jobs || [], eachJob(stats, tx), function(err) {
          if ( err ) console.log('Async each error', err);
          callback(null, stats);
        });
      });
    }

  , function(stats, callback) {
      tx.commit(function(err, res) {
        callback(err, stats);
      });
    }
  ], function(err, stats) {
    if ( err ) {
      logger.error('Unable to complete scheduler transaction', err);
      tx.rollback();
      return callback(err, stats);
    }

    callback(null, stats);
  });
};
