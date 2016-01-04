/**
 * Order Collaborators Schema
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
  definition.name = 'order_collaborators';

  definition.schema = {
    id:           { type: types.text, pk: true, default: 'uuid_generate_v4()' }
  , order_id:     { type: types.int, references: { table: 'orders', column: 'id', onDelete: 'set null' } }
  , user_id:      { type: types.int, references: { table: 'users', column: 'id', onDelete: 'set null' } }
  , created_at:   { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {
    order_collaborators_order_id_user_id_key: {
      type: 'UNIQUE'
    , columns: ['order_id', 'user_id']
    }
  };

  return definition;
});
