
/**
 * Module dependencies
 */

var
  // Configuration
  config = require('../config')

  // Database
, pg = require('pg')
, pgQuery = require('pg-query')
, builder = require('mongo-sql')
, helpers = require('./helpers')
;

//apply the parse-float plugin to node-postgres
require('pg-parse-float')(pg);
pg.defaults.hideDeprecationWarnings = config.pg.hideDeprecationWarnings;
pg.defaults.poolSize = config.pg.poolSize;

builder.registerConditionalHelper('$notExists', {cascade: false}, function( column, value, values, collection ){
  return 'not exists (' + builder.sql( value, values ).toString() + ')';
});

exports.builder = builder;

pgQuery.connectionParameters = config.postgresConnStr;
exports.query = pgQuery;

exports.getClient = function(connStr, callback) {
  if (typeof connStr === 'function') {
    callback = connStr;
    connStr = config.postgresConnStr;
  }
  // callback will have arguments: error, client, done
  pg.connect(connStr, callback);
}