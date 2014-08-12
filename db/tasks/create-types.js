/**
 * Dynamically adds new enum types to the database. Will also add
 * new values to existing types. Does NOT remove values, so you
 * will still need a delta for that (since there may be objects
 * that depend on that value)
 */

var
  db = require('../')
, async = require('async')
, _ = require('underscore')
, pgEnums = require('../pg-enums')
;

var cli = false;


var helpers = module.exports.helpers = {
  createType: function( type, callback ){
    var query = [
      'create type "' + type.name + '" as enum('
    , '  \'' + type.enum.join("', '") + '\''
    , ');'
    ].join('\n');

    db.query( query, callback );
  }

, typeExists: function( typeName, callback ){
    var query = 'select exists ( select 1 from pg_type where typname = \'' + typeName + '\' );';

    db.query( query, function( error, results ){
      if ( error ) return callback( error );

      return callback( null, results[0] ? results[0].exists : false );
    });
  }

, getExistingValues: function( typeName, callback ){
    var query = 'select unnest( enum_range( NULL::"' + typeName + '" ) );';

    db.query( query, function( error, results ){
      if ( error ) return callback( error );

      return callback( null, results.map( function( r ){
        return r.unnest;
      }));
    });
  }

, addValueToType: function( typeName, value, callback ){
    var query = 'alter type "' + typeName + '" add value \'' + value + '\'';

    db.query( query, callback );
  }
};

var done = function(callback) {
  return function(error, results) {
    console.log( (error) ? "Error creating types" : "Successfully created types");
    if(error) console.log(error);
    if (cli) return process.exit( (error) ? 1 : 0 );
    else if(callback) callback(error, results);
  }
};

module.exports.run = function( enumTypes, callback ){
  if ( typeof enumTypes === 'function' ){
    callback = enumTypes;
    enumTypes = null;
  }

  enumTypes = enumTypes || pgEnums;

  var alterExistingTypes = async.waterfall.bind( async, [
    function( done ){
      var onFilter = function( t, done ){
        helpers.typeExists( t, function( error, result ){
          if ( error ) done( false );
          else done( result );
        });
      };

      async.filter( Object.keys( enumTypes ), onFilter, done.bind( null, null ) );
    }

  , function( existingTypes, done ){
      var values = {};
      existingTypes.forEach( function( t ){
        values[ t ] = helpers.getExistingValues.bind( null, t );
      });

      async.parallel( values, done );
    }

  , function( existingValues, done ){
      var typesWithChanges = Object.keys( existingValues ).filter( function( k ){
        return _.difference( enumTypes[ k ], existingValues[ k ] ).length > 0;
      });

      // Only add the new values in enumTypes
      var fns = {};

      typesWithChanges.forEach( function( k ){
        var types = _.difference(
          enumTypes[ k ], existingValues[ k ]
        ).filter( function( v ){
          return enumTypes[ k ].indexOf( v ) > -1;
        });

        fns[ k ] = async.each.bind( async, types, helpers.addValueToType.bind( null, k ) );
        return ;
      });

      async.parallel( fns, done );
    }
  ]);

  var addNewTypes = async.waterfall.bind( async, [
    function( done ){
      var onFilter = function( t, cb ){
        helpers.typeExists( t, function( error, result ){
          if ( error ) cb( false );
          else cb( result );
        });
      };

      async.filter( Object.keys( enumTypes ), onFilter, done.bind( null, null ) );
    }
  , function( types, done ){
      done( null, _.omit( enumTypes, types ) );
    }
  , function( toCreate, done ){
      var types = Object.keys( toCreate ).map( function( k ){
        return { name: k, enum: toCreate[ k ] };
      });

      async.each( types, helpers.createType, done );
    }
  ]);

  async.parallel( [ alterExistingTypes, addNewTypes ], callback );
};

if (require.main === module) {
  cli = true;
  module.exports.run();
}
