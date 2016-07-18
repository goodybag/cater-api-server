/**
 * Order Notification Failures Schema
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
  definition.name = 'order_notification_failures';

  definition.schema = {
    id:           { type: types.serial, pk: true }
  , nid:          { type: types.text, nullable: false }
  , order_id:     { type: types.int, references: { table: 'orders', column: 'id', onDelete: 'set null' } }
  , user_id:      { type: types.int, references: { table: 'users', column: 'id', onDelete: 'set null' } }
  , data:         { type: types.jsonb, nullable: false, default: "'{}'" }
  , error:        { type: types.jsonb, nullable: false, default: "'{}'" }
  , created_at:   { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {};

  return definition;
});
