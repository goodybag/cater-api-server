var
  db = require('../')
, async = require('async')
, _ = require('underscore')
, pgEnums = require('../pg-enums')
;

var cli = false;


var helpers = {
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

, addType: function( typeName, value, callback ){
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

module.exports.run = function(callback) {
  var alterExistingTypes = async.waterfall.bind( async, [
    async.filter.bind( async, Object.keys( pgEnums ), helpers.typeExists )

  , function( existingTypes, done ){
      var values = {};

      existingTypes.forEach( function( t ){
        values[ t ] = helpers.getExistingValues.bind( null, t );
      });

      async.parallel( values, done );
    }

  , function( existingValues, done ){
      var typesWithChanges = Object.keys( existingValues ).filter( function( k ){
        return _.difference( pgEnums[ k ], existingValues[ k ] ).length > 0;
      });

      // Only add the new values in pgEnums module
      var fns = {};

      Object.keys( typesWithChanges ).forEach( function( k ){
        var types = _.difference(
          pgEnums[ k ], existingValues[ k ]
        ).filter( function( v ){
          return pgEnums[ k ].indexOf( v ) > -1;
        });
        fns[ k ] = async.each.bind( async, types, helpers.addType.bind( null, k ) );
        return ;
      });

      async.parallel()
    }
  ]);

  var addNewTypes = async.waterfall.bind( async, [

  ]);

  async.parallel( [ alterExistingTypes, addNewTypes ], callback );
};

if (require.main === module) {
  cli = true;
  module.exports.run();
}
