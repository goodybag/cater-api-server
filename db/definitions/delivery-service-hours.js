/**
 * Delivery Service Hours Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

var
  types = require('../data-types')
;

define(function(require) {
  var definition = {};
  definition.name = 'delivery_service_hours';

  definition.schema = {
    id:         { type: types.serial, pk: true }
  , created_at: { type: types.timestamptz, nullable: false, default: 'NOW()' }
  , ds_id:      { type: types.int, nullable: false, references: { table: 'delivery_services', column: 'id', onDelete: 'cascade' } }
  , day:        { type: types.int, checks: [ '>= 0', '<= 6'], nullable: false }
  , start_time: { type: types.time, nullable: false }
  , end_time:   { type: types.time, nullable: false }
  };

  definition.indices = {};

  return definition;
});
