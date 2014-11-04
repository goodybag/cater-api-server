/**
 * Amenities Schema
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
  definition.name = 'amenities';

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
  , name: {
      type: types.text
    }
  , description: {
      type: types.text
    }
  , price: {
      type: types.int
    , nullable: false
    , default: 0
    }
  , restaurant_id: {
      type: types.int
    , nullable: false
    , references: {
        table: 'restaurants'
      , column: 'id'
      , onDelete: 'cascade'
      }
    }
  , scale: {
      type: types.amenity_scale
    , default: '\'flat\'::amenity_scale'
    }
  , enabled: {
      type: types.boolean
    , default: false
    }
  };

  definition.indices = {};

  return definition;
});
