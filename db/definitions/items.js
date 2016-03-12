/**
 * Items Schema
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
  definition.name = 'items';

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
    , references: {table: 'restaurants', column: 'id', onDelete: 'cascade'}
    }
  , category_id: {
      type: types.int
    , nullable: true
    , references: {table: 'categories', column: 'id', onDelete: 'cascade'}
    }
  , order: {
      type: types.int
    , nullable: false
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
  , options_sets: {
      type: types.json
    , nullable: true
    }
  , is_hidden: {
      type: types.boolean
    , nullable: false
    , default: false
    }
  , hide_pricing: {
      type: types.boolean
    , nullable: false
    , default: false
    }
  , photo_url: {
      type: types.text
    , nullable: true
    }
  , is_popular: {
      type: types.boolean
    , nullable: false
    , default: false
    }
  };

  definition.indices = {};

  return definition;
});
