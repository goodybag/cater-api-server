/**
 * Delivery Services Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

var
  types = require('../data-types')
, dirac = require('dirac')
;

define(function(require) {
  var definition = {};
  definition.name = 'delivery_services';

  definition.schema = {
    id:           { type: types.serial, pk: true }
  , region_id:    { type: types.int, references: { table: 'regions', column: 'id', onDelete: 'set null' } }
  , name:         { type: types.text }
  , rate:         { type: types.numeric( 5, 5 ), nullable: false, default: 0 }
  , created_at:   { type: types.timestamptz, nullable: false, default: 'NOW()' }
  };

  definition.indices = {};

  // Ensure delivery zips get saved properly in a TX
  // definition.update = function( $query, updates, options, callback ){
  //   // Not updating zips, just move along
  //   if ( !updates.zips ) return dirac.DAL.update.apply( this, arguments );

  //   // If they're not updating 1 document, let's just avoid this
  //   if ( typeof $query === 'object' )

  //   if ( typeof options == 'function' ){
  //     callback = options;
  //     options = {};
  //   }

  //   dirac.transaction( function( tx ){
  //     tx.dals.delivery_service_zips.remove({})
  //   });
  // };

  return definition;
});
