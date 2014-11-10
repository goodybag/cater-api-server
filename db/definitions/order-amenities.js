/**
 * order,amenities Schema
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
  definition.name = 'order_amenities';

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
  , order_id: {
      type: types.int
    , nullable: false
    , references: {
        table: 'orders'
      , column: 'id'
      , onDelete: 'cascade'
      }
    }
  , amenity_id: {
      type: types.int
    , nullable: false
    , references: {
        table: 'amenities'
      , column: 'id'
      , onDelete: 'cascade'
      }
    }
  };

  definition.indices = {};

  return definition;
});
