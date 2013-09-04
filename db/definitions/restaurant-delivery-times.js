/**
 * Restaurant Delivery Times Schema
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
  definition.name = 'restaurant_delivery_times';

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
    , references: {table: 'restaurants', column: 'id'}
    }
  , day: {
      type: types.int
    , checks: [ '>= 0', '<= 6']
    , nullable: false
    }
  , start_time: {
      type: types.time
    , nullable: false
    }
  , end_time: {
      type: types.time
    , nullable: false
    }
  };

  definition.indices = {};

  return definition;
});
