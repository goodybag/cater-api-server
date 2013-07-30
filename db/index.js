
/**
 * Module dependencies
 */

var
  // Configuration
  config = require('../config')

  // Database
, pg = require('pg')
, sql = require('sql')
, builder = require('mongo-sql')
, pooler = require('generic-pool')
, Transaction = require('pg-transaction')

  // Promise to fullfil this variable!
, client = null

  // Other packages in use
, async = require('async')
// , logger = require('../lib/logger')({app: 'api', component: 'db'})
, ok = require('okay')
;

//apply the parse-float plugin to node-postgres
require('pg-parse-float')(pg);
pg.defaults.hideDeprecationWarnings = config.pg.hideDeprecationWarnings;
pg.defaults.poolSize = config.pg.poolSize;

exports.sql = sql;
exports.builder = builder;

// var logQuery = function(query) {
//   var start = new Date();
//   var text = query.text;
//   query.once('end', function(result) {
//     var duration = new Date() - start;
//     var rows = (result||0).rowCount;
//     logger.debug(['db', 'query'], 'query', { duration: duration, text: text, rows: rows });
//   });
// };

// pg.Client.prototype.$query = pg.Client.prototype.query;
// pg.Client.prototype.query = function() {
//   var q = this.$query.apply(this, arguments);
//   logQuery(q);
//   return q;
// }

exports.getClient = function(logTags, callback){
  callback = process.domain ? process.domain.bind(callback) : callback;

  if (typeof logTags == 'function') {
    callback = logTags;
    logTags = null;
  }
  if (!logTags)
    logTags = ['unnamed'];

  var handle = function(err, client, done) {
    if(err) return callback(err, null, function() { console.log('done called from error callback') });
    addToDomain(client);
    client.logTags = logTags;


    //TODO auto-release after a specific timeout
    var tid = setTimeout(function() {
      // logger.warn(client.logTags, 'client has been checked out for too long!');
      console.log(client.logTags, 'client has been checked out for too long!');
      //destroy the client
      done(client);
    }, 10000);
    //return a custom done function so we can
    //clear our leak checker
    callback(null, client, function(c) {
      clearTimeout(tid);
      removeFromDomain(client);
      done(c);
    });

  };

  handle = process.domain ? process.domain.bind(handle) : handle;

  var pool = pg.pools.all[JSON.stringify(config.postgresConnStr)];

  swapDomain(pool);
  pg.connect(config.postgresConnStr, function(err, client, done) {
    handle(err, client, done);
  });

  return;
};



exports.query = function(text, params, callback) {
  if(typeof params === 'function') {
    callback = params;
    params = {};
  }

  if(text.toQuery) {
    var q = text.toQuery();
    text = q.text;
    params = q.values;
  }
  var pool = pg.pools.all[JSON.stringify(config.postgresConnStr)];
  swapDomain(pool);
  callback = process.domain ?  process.domain.bind(callback) : callback;
  //once this is upgraded to v1.0 we can use `okay` because
  //arity checking is removed
  pg.connect(config.postgresConnStr, function(err, client, done) {
    if(err) return callback(err);
    addToDomain(client);
    client.query(text, params, function(err, result) {
      //release the client
      done();
      if(err) return callback(err);
      return callback(null, result.rows, result);
    });
  });
};

var swapDomain = function(emitter) {
  if(!emitter) return;
  if(emitter.domain) {
    emitter.domain.remove(emitter);
  }
  if(process.domain) {
    process.domain.add(emitter);
  }
};

//TODO this needs to go in node-postgres
var addToDomain = function(client) {
  if(client.domain) removeFromDomain(client);
  if(!process.domain) return;
  process.domain.add(client);
  process.domain.add(client.connection);
  process.domain.add(client.connection.stream);
};

var removeFromDomain = function(client) {
  if(!client.domain) return;
  var d = client.domain;
  d.remove(client.connection.stream);
  d.remove(client.connection);
  d.remove(client);
}

/**
 * Uses a transaction to update a record and insert if DNE
 * @param  {Object} client       PostGres db client
 * @param  {String} updateQuery  Update query to attempt first
 * @param  {Array}  updateValues Values to use in the update query
 * @param  {String} insertQuery  Insert query to attempt if update did not affect any rows
 * @param  {Array}  insertValues Values to use in the insert query
 * @param  {Func}   originalCb   Callback on completion
 * @param  {Object} tx           Optional. PostGres transaction to use (created if not given)
 * @return undefined
 */
exports.upsert = function(client, updateQuery, updateValues, insertQuery, insertValues, tx, originalCb) {
  if (typeof tx == 'function') {
    originalCb = tx;
    tx = null;
  }

  var shouldCommitOnFinish = (!tx); // commit on finish if we're not given a transaction
  var savePointed = false;
  var stage = ''; // for logging
  originalCb = process.domain ? process.domain.bind(originalCb) : originalCb;

  // checks into our upsert to see if we've finished or not
  var checkResults = function(continueCb) {
    return function(err, results) {
      if (err) {
        // logger.debug(client.logTags || ['upsert'], err);
        // an error, abort
        if (savePointed) { tx.release('upsert'); }
        tx.abort(function() { originalCb(err); });
      } else {
        if (results[1].rowCount === 1) {
          // success, we're done
          if (savePointed) { tx.release('upsert'); }
          if (shouldCommitOnFinish) {
            tx.commit(function(error){
              originalCb(error, results[1]);
            });
          } else {
            originalCb(null, results[1]);
          }
        } else {
          // carry on
          continueCb && continueCb();
        }
      }
    };
  };

  // try to update first
  async.series([
    function(cb) {
      // init transaction
      stage = 'begin';
      if (!tx) {
        tx = new Transaction(client);
        tx.begin(cb);
      } else {
        cb();
      }
    },
    function(cb) {
      // run update
      stage = 'update1';
      tx.query(updateQuery, updateValues, cb);
    }
  ], checkResults(function() {
    // update failed, attempt an insert
    async.series([
      function(cb) {
        // make a savepoint
        stage = 'savepoint';
        tx.savepoint('upsert', cb);
      },
      function(cb) {
        // run insert
        savePointed = true;
        stage = 'insert';
        tx.query(insertQuery, insertValues, cb);
      }
    ], checkResults(function() {
      // insert failed; the session must have been created since the time that we failed the update
      async.series([
        function(cb) {
          // rollback to the savepoint
          stage = 'rollback';
          tx.rollback('upsert', cb);
        },
        function(cb) {
          // update again
          stage = 'update2';
          tx.query(updateQuery, updateValues, cb);
        }
      ], checkResults());
    }));
  }));
};
