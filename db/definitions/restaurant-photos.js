/**
 * Restaurant Photos Types Schema
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
  definition.name = 'restaurant_photos';

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
  , url: {
      type: types.text
    , nullable: false
    }
  , name: {
      type: types.text
    }
  , description: {
      type: types.text
    }
  , priority: {
      type: types.int
    }
  };

  definition.indices = {};

  return definition;
});
