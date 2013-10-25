/**
 * Meal Types Schema
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
  definition.name = 'meal_types';

  definition.schema = {
    name: {
      name: types.text
    , pk: true
    }
  , id: {
      type: types.serial
    , nullable: false
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  };

  definition.indices = {};

  return definition;
});
