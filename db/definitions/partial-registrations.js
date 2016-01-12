/**
 * Partial Registrations Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

var dirac = require('dirac');
var utils = require('utils');
var types = require('../data-types');

define(function(require) {
  var definition = {};
  definition.name = 'partial_registrations';

  definition.schema = {
    id:               { type: types.serial, pk: true }
  , user_id:          { type: types.int, references: { table: 'users', column: 'id', onDelete: 'cascade' } }
  , token:            { type: types.text, pk: true, default: 'uuid_generate_v4()' }
  , has_consumed:     { type: types.boolean, nullable: false, default: 'false' }
  , created_at:       { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {
    
  };

  definition.create = function( email, callback ){
    var tx = dirac.tx.create();

    utils.async.waterfall([
      ( next )=>{
        tx.begin( error => next( error ) );
      }

      // Insert the user
    , tx.users.register.bind( tx.users, {
        email: email
      , password: utils.uuid.v4()
      })

      // Insert the partial registration
    , ( user, next )=>{
        var options = { returning: ['*'] };
        tx.partial_registrations.insert( { user_id: user.id }, ( error, results )=>{
          if ( error ){
            return next( error );
          }

          user.partialRegistration = results[0];

          return next( null, user );
        });
      }
    ], ( error, user )=>{
      if ( error ){
        if ( this.client ){
          return callback( error );
        }

        return tx.rollback( function(){
          return callback( error );
        });
      }

      callback( null, user );
    });
  };

  definition.consume = function( token, data, callback ){
   var tx = dirac.tx.create();

    utils.async.waterfall([
      tx.begin.bind( tx )

      // Insert the user
    , tx.partial_registrations.update.bind(
        tx.partial_registrations
      , { token: token }
      , { has_consumed: true }
      , { returning: ['*'] }
      )

    , ( partialRegistration, next )=>{
        var options = { returning: ['*'] };
        tx.users.update( partialRegistration.user_id, data, next );
      }
    ], ( error, user )=>{
      if ( error ){
        if ( this.client ){
          return callback( error );
        }

        return tx.rollback( function(){
          return callback( error );
        });
      }

      callback( null, user );
    });
  };

  return definition;
});
