
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
;

//apply the parse-float plugin to node-postgres
require('pg-parse-float')(pg);
pg.defaults.hideDeprecationWarnings = config.pg.hideDeprecationWarnings;
pg.defaults.poolSize = config.pg.poolSize;

exports.builder = builder;

pgQuery.connectionParameters = config.postgresConnStr;
exports.query = pgQuery;
