
/**
 * Module dependencies
 */

var
  // Configuration
  config = require('../config')

  // Database
, pg            = require('pg')
, pgQuery       = require('pg-query')
, builder       = require('mongo-sql')
, dirac         = require('dirac')
, fs            = require('fs')
, path          = require('path')
, helpers       = require('./helpers')
, Tx            = require('pg-transaction')
, typeParsers   = require('./type-parsers')
;

//apply the parse-float plugin to node-postgres
require('pg-parse-float')(pg);
pg.defaults.hideDeprecationWarnings = config.pg.hideDeprecationWarnings;
pg.defaults.poolSize = config.pg.poolSize;

exports.builder = builder;

pgQuery.connectionParameters = config.postgresConnStr;
exports.query = pgQuery;

exports.query2 = function(query, callback) {
  var sql = builder.sql(query);
  pgQuery(sql.query, sql.values, callback);
}

var dir = path.join( __dirname, './definitions' );
fs.readdirSync( dir ).filter( function( f ){
  return fs.statSync( path.join( dir, f ) ).isFile() && f.slice(-3) == '.js'
}).forEach( function( f ){
  dirac.register( require( path.join( dir, f ) ) );
});

dirac.init( config.postgresConnStr );

for ( var key in dirac.dals ){
  exports[ key ] = dirac.dals[ key ];
}

exports.getClient = function(connStr, callback) {
  if (typeof connStr === 'function') {
    callback = connStr;
    connStr = config.postgresConnStr;
  }
  // callback will have arguments: error, client, done
  pg.connect(connStr, callback);
}

exports.transaction = function( callback ){
  exports.getClient( function( error, client ){
    if ( error ) return callback( error );

    return callback( null, new Tx( client ) );
  });
};