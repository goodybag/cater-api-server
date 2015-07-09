/**
 * Order Internal Notes Schema
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
  definition.name = 'order_internal_notes';

  definition.schema = {
    id:         { type: 'serial', pk: true }
  , order_id:   { type: 'int', references: { table: 'orders', column: 'id' } }
  , body:       { type: 'text', nullable: false, default: '' }
  , created_at: { type: 'timestamp', nullable: false, default: 'now()'}
  };

  definition.indices = {};

  return definition;
});
