/**
 * Menu Items Schema
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
  definition.name = 'menus_items';

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
  , order: {
      type: types.int
    , nullable: false
    }
  , menu_category_id: {
      type: types.int
    , nullable: false
    , references: {table: 'menu_categories', column: 'id'}
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
  };

  definition.indices = {};

  return definition;
});