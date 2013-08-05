/**
 * Users Schema
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
  definition.name = 'categories';

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
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {table: 'restaurants', column: 'id'}
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , description: {
      type: types.text
    , nullable: true
    }
  , order: {
      type: types.int
    , nullable: false
    }
  };

  definition.indices = {};

  return definition;
});