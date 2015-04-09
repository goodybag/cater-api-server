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
    id:                 { type: types.serial, pk: true }
  , region_id:          { type: types.int, references: { table: 'regions', column: 'id', onDelete: 'set null' } }
  , name:               { type: types.text }
  , rate:               { type: types.numeric( 5, 5 ), nullable: false, default: 0 }
  , order_email:        { type: types.text }
  , order_phone:        { type: types.varchar( 10 ) }
  , created_at:         { type: types.timestamptz, nullable: false, default: 'NOW()' }
  , region_order_distribution: { type: types.numeric( 5, 4 ), nullable: false, default: 1 }
  };

  definition.indices = {};

  return definition;
});
