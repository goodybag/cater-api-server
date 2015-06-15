/**
 * Order Notifications Schema
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
  definition.name = 'order_notifications';

  definition.schema = {
    id:           { type: types.serial, pk: true }
  , nid:          { type: types.text, nullable: false }
  , order_id:     { type: types.int, references: { table: 'orders', column: 'id', onDelete: 'set null' } }
  , user_id:      { type: types.int, references: { table: 'users', column: 'id', onDelete: 'set null' } }
  , data:         { type: types.json }
  , send_date:    { type: types.timestamp, nullable: false, default: 'now()' }
  , created_at:   { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {};

  return definition;
});
