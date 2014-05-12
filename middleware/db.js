/**
 * Attach db result object/objects to res.locals
 * Pretty simple right now. The queries are static
 * ( as in you can really respond to url parameters )
 * So, whatever data you're putting on there is purely
 * auxiliary and doesn't really rely on external state
 *
 * Usage:
 *
 *   // res.locals.orders = [...];
 *   app.get('/users'
 *     m.db.orders.find( {}, { limit: 'all' } )
 *   , m.view('users', db.users, { operation: 'find' } )
 *   );
 *
 * If you're doing a findOne/insert, is uses the singular form:
 *
 *   // res.locals.someThing = { ... }
 *   app.get('/users'
 *     m.db.someThings.findOne( 1 )
 *   , m.view('users', db.users, { operation: 'find' } )
 *   );
 */

var dirac = require('dirac');
var db    = require('../db');
var utils = require('../utils');

var supportedMethods = [
  'find', 'findOne', 'insert', 'update', 'remove'
];

var getMiddlewareFn = function( table, method ){
  // TODO: check insert data to see if it's an array to determine if
  // the results really be singular
  var isSingular = ['findOne', 'insert'].indexOf( method ) > - 1;

  return function(){
    var args = Array.prototype.slice.call( arguments );

    return function( req, res, next ){
      db[ table ][ method ].apply( db[ table ], args.concat( function( error, results ){
        if ( error ) return next( error );

        res.locals[ isSingular ? utils.words.singular( table ) : table ] = results;

        next();
      }));
    };
  };
};

Object.keys( db ).filter( function( k ){
  return db[ k ] instanceof dirac.DAL;
}).forEach( function( table ){
  module.exports[ table ] = {};

  supportedMethods.forEach( function( method ){
    module.exports[ table ][ method ] = getMiddlewareFn( table, method );
  });
});