/**
 * Requested Restaurants Schema
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
  definition.name = 'requested-restaurants';

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
  , user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id'}
    }
  , votes: {
      type: types.int
    , checks: ['>= 0']
    , default: 0
    }
  , restaurant: {
      type: types.text
    , nullable: false
    }
  };

  definition.indices = {};

  return definition;
});
