/**
 * Restaurant Lead Times Schema
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
  definition.name = 'restaurant_lead_times';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
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
  , max_guests: {
      type: types.int
    , nullable: false
    , default: 0
    }
  , lead_time: {
      type: types.int
    , nullable: false
    , default: 0
    }
  , cancel_time: {
      type: types.int
    , nullable: true
    , default: 0
    }
  };

  definition.indices = {};

  return definition;
});
