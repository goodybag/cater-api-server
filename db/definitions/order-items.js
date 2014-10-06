/**
 * Order Items Schema
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
  definition.name = 'order_items';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , item_id: {
      type: types.int
    , nullable: true
    , references: {table: 'items', column: 'id', onDelete: 'set null'}
    }
  , order_id: {
      type: types.int
    , nullable: false
    , references: {table: 'orders', column: 'id', onDelete: 'cascade'}
    }
  , quantity: {
      type: types.int
    , nullable: false
    , default: 1
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , description: {
      type: types.text
    , nullable: true
    }
  , price: {
      type: types.int
    , nullable: false
    }
  , feeds_min: {
      type: types.int
    , nullable: false
    }
  , feeds_max: {
      type: types.int
    , nullable: false
    }
  , min_qty: {
      type: types.int
    , nullable: false
    , default: 0
    }
  , notes: {
      type: types.text
    , nullable: true
    }
  , options_sets: {
      type: types.json
    , nullable: true
    }
  , recipient: {
      type: types.text
    , nullable: true
    }
  };

  definition.indices = {};

  return definition;
});
