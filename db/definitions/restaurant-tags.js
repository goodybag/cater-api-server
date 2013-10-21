/**
 * Restaurant Tags Schema
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
  definition.name = 'restaurant_tags';

  definition.schema = {
    restaurant_id: {
      type: types.int
    , references: {table: 'restaurants', column: 'id'}
    }
  , tag: {
      type: types.text
    , references: {table: 'tags', column: 'name'}
    }
  };

  definition.indices = {};

  definition.extras = ['PRIMARY KEY ("restaurant_id", "tag")'];

  return definition;
});
