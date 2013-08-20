/**
 * Password Resets Schema
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
  definition.name = 'password_resets';

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
  , user_id: {
      type: types.int
    , nullable: false
    , references: {table: 'users', column: 'id'}
    }
  , token: {
      type: types.text
    , nullable: false
    }
  , token_used: {
      type: types.timestamp
    , nullable: true
    }
  };

  definition.indices = {};

  return definition;
});
