/**
 * Users Redemptions Schema
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
  definition.name = 'users_redemptions';

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
  , user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id', onDelete: 'cascade'}
    }
  , location: {
      type: types.text
    , nullable: true
    }
  , amount: { // Reward value
      type: types.int
    , nullable: false
    , default: 0
    }
  , cost: {
      type: types.int
    , nullable: false
    , default: 0
    }
  };

  definition.indices = {};

  return definition;
});
