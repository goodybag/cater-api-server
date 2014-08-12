var assert      = require('assert');
var db          = require('../../db');
var utils       = require('../../utils');
var createTypes = require('../../db/tasks/create-types');

var types = {};

types[ 'type_' + parseInt(Math.random()*0xffffff).toString(36) ] = [ 'a', 'b' ];
types[ 'type_' + parseInt(Math.random()*0xffffff).toString(36) ] = [ 'a', 'b' ];

describe ('DB Tasks: Create Types', function(){
  it ('should create types that do no exist', function( done ){
    utils.async.series([
      // Ensure the types do not exist first
      utils.async.each.bind( utils.async, Object.keys( types ), function( t, done ){
        createTypes.helpers.typeExists( t, function( error, result ){
          assert( !error, 'Error checking if type `' + t + '` exists', error );
          assert( !result, 'Type `' + t + '` did exist' );
          done();
        });
      })

      // Create the types
    , createTypes.run.bind( null, types )

      // Ensure the types now exist
    , utils.async.each.bind( utils.async, Object.keys( types ), function( t, done ){
        createTypes.helpers.typeExists( t, function( error, result ){
          assert( !error, 'Error checking if type `' + t + '` exists', error );
          assert( result, 'Type `' + t + '` did not exist' );
          done();
        });
      })

      // Ensure each value exists
    , utils.async.each.bind( utils.async, Object.keys( types ), function( t, done ){
        createTypes.helpers.getExistingValues( t, function( error, values ){
          assert( !error, 'Error getting values for type: `' + t + '`', error );
          types[ t ].forEach( function( v ){
            assert( values.indexOf( v ) > -1, 'Value `' + v + '` not in DB type `' + t + '`' );
          });
          done();
        });
      })
    ], done );
  });

  it ('should add to types that do exist', function( done ){
    var k = Object.keys( types )[0];
    types[ k ].push( 'c', 'd' );

    utils.async.series([
      // Ensure the types exist
      utils.async.each.bind( utils.async, Object.keys( types ), function( t, done ){
        createTypes.helpers.typeExists( t, function( error, result ){
          assert( !error, 'Error checking if type `' + t + '` exists', error );
          assert( result, 'Type `' + t + '` did not exist' );
          done();
        });
      })

      // Create the new values
    , createTypes.run.bind( null, types )

      // Ensure each value exists
    , utils.async.each.bind( utils.async, Object.keys( types ), function( t, done ){
        createTypes.helpers.getExistingValues( t, function( error, values ){
          assert( !error, 'Error getting values for type: `' + t + '`', error );
          types[ t ].forEach( function( v ){
            assert( values.indexOf( v ) > -1, 'Value `' + v + '` not in DB type `' + t + '`' );
          });
          done();
        });
      })
    ], done );
  });
});
