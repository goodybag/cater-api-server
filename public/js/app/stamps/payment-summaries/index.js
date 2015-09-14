/**
 * Payment Summaries
 */

var stampit = require('stampit');
var Promise = require('bluebird');
var utils   = require('utils');
var db      = require('db');

module.exports = stampit();

var stamps = {
  autoPopulate: require('./auto-populate')
, base:         require('./base')
, db:           require('./db')
};

module.exports = module.exports.compose.apply(
  module.exports
, utils.values( stamps )
);

utils.extend( module.exports, stamps );

Promise.promisifyAll( module.exports.fixed.methods );

module.exports.find = function( where, options, callback ){
  return db.payment_summaries.find(
    where
  , utils.extend( stamps.db.getQueryOptions(), options )
  , function( error, results ){
      if ( error ) return callback( error );

      results = results.map( function( pms ){
        return module.exports.create().parseDbResult( pms );
      });

      callback( null, results );
    }
  );
};

Promise.promisify( module.exports.find );