/**
 * Restaurant Meal Types Schema
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
  definition.name = 'restaurant_meal_types';

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
  , meal_type: {
      type: types.text
    , nullable: false
    , references: {table: 'meal_types', column: 'name', onDelete: 'cascade'}
    }
  };

  definition.indices = {};

  definition.extras = ['PRIMARY KEY ("restaurant_id", "meal_type")'];

  return definition;
});
