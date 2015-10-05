/**
 * Order Notifications Schema
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
  definition.name = 'user_courier_preferences';

  definition.schema = {
    user_id: { type: types.int, references: { table: 'users', column: 'id', onDelete: 'cascade' } }
  , delivery_service_id: { type: types.int, references: { table: 'delivery_services', column: 'id', onDelete: 'cascade' } }
  };

  definition.indices = {};
  definition.extras = ['primary key (user_id, delivery_service_id)'];

  /**
   * Atomically save new courier preferences for a user
   * @param  {Number}   user_id  ID of the user
   * @param  {Array}   couriers An array of delivery_service_id's
   * @param  {Function} callback callback(error)
   */
  definition.save = function( user_id, couriers, callback ){
    if ( !Array.isArray( couriers ) ){
      throw new Error( 'Invalid second argument. Expected Array, supplied: ' + typeof courier );
    }

    var tx = this.client || dirac.tx.create();

    utils.async.series([
      // If we're in the middle of a transaction, do not try to begin
      this.client ? utils.async.noop : tx.begin.bind( tx )

      // Remove existing preferences
    , tx.user_courier_preferences.remove.bind( tx.user_courier_preferences, {
        user_id: user_id
      })

    , couriers.length > 0
        // If the array isn't empty, insert the new preferences
      ? tx.user_courier_preferences.insert.bind(
          tx.user_courier_preferences
        , couriers.map( function( id ){
            return { user_id: user_id, delivery_service_id: id };
          })
        )
        // Otherwise, we're done
      : utils.async.noop

      // If we're in the middle of a transaction, do not try to commit
    , this.client ? utils.async.noop : tx.commit.bind( tx )
    ], function( error ){
      if ( error ){
        return tx.rollback( function(){
          return callback( error );
        });
      }

      return callback();
    });

    return this;
  };

  return definition;
});
