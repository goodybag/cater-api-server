/**
 * Restaurant Meal Styles Schema
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
  definition.name = 'restaurant_meal_styles';

  definition.schema = {
    id: {
      type: types.serial
    , nullable: false
    , unique: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {table: 'restaurants', column: 'id', onDelete: 'cascade'}
    }
  , meal_style: {
      type: types.text
    , nullable: false
    , references: {table: 'meal_styles', column: 'name', onDelete: 'cascade'}
    }
  };

  definition.indices = {};

  definition.extras = ['PRIMARY KEY ("restaurant_id", "meal_style")'];

  return definition;
});
