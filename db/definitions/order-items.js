/**
 * Orders Schema
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
  definition.name = 'orders_items';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , created_at: {
      type: types.timestamp
    , nullable: false
    , default: 'NOW()'
    }
  , order_id: {
      type: types.int
    , nullable: false
    , references: {table: 'orders', column: 'id'}
    }
  , menu_item_id: {
      type: types.int
    , nullable: false
    , references: {table: 'orders', column: 'id'}
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
  , notes: {
      type: types.text
    , nullable: true
    }
  };

  definition.indices = {};

  return definition;
});