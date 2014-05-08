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