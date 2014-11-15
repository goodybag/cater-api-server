/**
 * Order Driver Requests Schema
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
  definition.name = 'order_driver_requests';

  definition.schema = {
    id:             { type: types.serial, pk: true }
  , user_id:        { type: types.int, references: { table: 'users', column: 'id', onDelete: 'set null' } }
  , order_id:       { type: types.int, references: { table: 'orders', column: 'id', onDelete: 'set null' } }
  , response:       { type: types.boolean }
  , response_date:  { type: types.timestamp }
  , created_at:     { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {};

  return definition;
});