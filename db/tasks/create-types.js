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
, customTypes = require('../custom-types')
;

var cli = false;

var queries = module.exports.queries = {
  types: {
    enum: function( data ){
      return [
        'create type "' + data.name + '" as enum('
      , '  \'' + data.enum.join("', '") + '\''
      , ');'
      ].join('\n')
    }

  , domain: function( data ){
      return 'create domain "' + data.name + '" as ' + data.as;
    }
  }

, typeExists: function( data ){
    return 'select exists ( select 1 from pg_type where typname = \'' + data.name + '\' );'
  }

, existingValues: function( data ){
    return 'select unnest( enum_range( NULL::"' + data.name + '" ) );';
  }

, addValueToType: function( data ){
    return 'alter type "' + data.name + '" add value \'' + data.value + '\''
  }
};

var helpers = module.exports.helpers = {
  typeExists: function( typeName, callback ){
    db.query( queries.typeExists({ name: typeName }), function( error, results ){
      if ( error ) return callback( error );

      return callback( null, results[0] ? results[0].exists : false );
    });
  }

, getExistingValues: function( typeName, callback ){
    db.query( queries.existingValues({ name: typeName }), function( error, results ){
      if ( error ) return callback( error );

      return callback( null, results.map( function( r ){
        return r.unnest;
      }));
    });
  }

, addValueToType: function( typeName, value, callback ){
    db.query( queries.addValueToType({ name: typeName, value: value }) , callback );
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

module.exports.run = function( cTypes, callback ){
  if ( typeof cTypes === 'function' ){
    callback = cTypes;
    cTypes = null;
  }

  cTypes = cTypes || customTypes;

  Object.keys( cTypes ).filter( function( k ){
    return typeof cTypes[ k ] === 'object' && !Array.isArray( cTypes[ k ] );
  }).forEach( function( k ){
    if ( !( cTypes[ k ].type in queries.types ) ){
      throw new Error('Create Types does not support type: `' + cTypes[ k ].type + '`');
    }
  });

  async.parallel([
    ///////////////////////////////
    // Alter existing enum types //
    ///////////////////////////////
    async.waterfall.bind( async, [
      // Filter to enums that currently exist
      function( done ){
        var onFilter = function( t, done ){
          // Only enums are arrays
          if ( !Array.isArray( cTypes[ t ] ) ) return done( false );

          helpers.typeExists( t, function( error, result ){
            if ( error ) done( false );
            else done( result );
          });
        };

        async.filter( Object.keys( cTypes ), onFilter, done.bind( null, null ) );
      }

      // Get the exiting values for the types
    , function( existingTypes, done ){
        var values = {};
        existingTypes.forEach( function( t ){
          values[ t ] = helpers.getExistingValues.bind( null, t );
        });

        async.parallel( values, done );
      }

      // Add the values that don't exist in the DB
    , function( existingValues, done ){
        var typesWithChanges = Object.keys( existingValues ).filter( function( k ){
          return _.difference( cTypes[ k ], existingValues[ k ] ).length > 0;
        });

        // Only add the new values in cTypes
        var fns = {};

        typesWithChanges.forEach( function( k ){
          var types = _.difference(
            cTypes[ k ], existingValues[ k ]
          ).filter( function( v ){
            return cTypes[ k ].indexOf( v ) > -1;
          });

          fns[ k ] = async.each.bind( async, types, helpers.addValueToType.bind( null, k ) );
          return ;
        });

        async.parallel( fns, done );
      }
    ])

    ///////////////////
    // Add new types //
    ///////////////////
  , async.waterfall.bind( async, [
      function( done ){
        var onFilter = function( t, cb ){
          helpers.typeExists( t, function( error, result ){
            if ( error ) cb( false );
            else cb( result );
          });
        };

        async.filter( Object.keys( cTypes ), onFilter, done.bind( null, null ) );
      }
    , function( types, done ){
        done( null, _.omit( cTypes, types ) );
      }
    , function( toCreate, done ){
        var typeQueries = Object.keys( toCreate ).map( function( k ){
          var def = {
            type: Array.isArray( toCreate[ k ] ) ? 'enum' : toCreate[ k ].type
          , name: k
          };

          if ( def.type === 'enum' ) def.enum = toCreate[ k ];
          else def.as = toCreate[ k ].as;

          return def;
        }).map( function( type ){
          return queries.types[ type.type ]( type );
        });

        async.each( typeQueries, db.query.bind( db ), done );
      }
    ])
  ], callback );
};

if (require.main === module) {
  cli = true;
  module.exports.run();
}
