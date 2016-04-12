var dirac     = require('dirac');
var pluralize = require('pluralize');
var _         = require('lodash');
var errors    = require('../errors');

module.exports = function(name, collection, options){
  if ( collection && !(collection instanceof dirac.DAL) ){
    options = collection;
    collection = null;
  }

  options = options || {};
  options.method = options.method || 'find';

  var defaults = {
    onError( error, req, res, next ){
      return next( error );
    }
  , notFound: function( req, res, next ){
      return next( errors.internal.NOT_FOUND );
    }
  };

  for ( var key in defaults ){
    if ( !( key in options ) ) options[ key ] = defaults[ key ];
  }

  return function(req, res, next){
    collection = collection || req.collection;

    if ( collection ){
      var args;
      switch ( options.method ){
        case 'find': case 'findOne': case 'remove':
          args = [ req.queryObj, req.queryOptions ];
        break;
        case 'insert':
          args = [ req.body, req.queryOptions ];
        break;
        case 'update':
          args = [ req.queryObj, req.body, req.queryOptions ];
        break;
        default: break;
      }

      args.push( function( error, results ){
        if ( error ){
          return options.onError( error, req, res, next );
        }

        if ( !results ){
          return options.notFound( req, res, next );
        }

        var alias = options.localsAlias;

        if ( !alias ){
          // If results is an array, we want to set the local
          // view variable to the plural form of that object type
          // otherwise, use the singular form
          alias = Array.isArray( results )
            ? collection.table
            : pluralize.singular( collection.table );
        }

        res.locals[ alias ] = results;

        if ( options.transformLocals ){
          _.assign( res.locals, options.transformLocals( res.locals ) );
        }

        res.render( name, _.omit( options, [ 'notFound', 'error' ] ) );
      });

      collection[ options.method ].apply( collection, args );
    } else {
      res.render( name, _.omit( options, [ 'notFound', 'error' ] ) );
    }
  };
};
