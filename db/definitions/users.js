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
  definition.name = 'users';

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
  , first_name: {
      type: types.text
    , nullable: false
    }
  , last_name: {
      type: types.text
    , nullable: false
    }
  , email: {
      type: types.text
    , nullable: false
    , unique: true
    }
  , password: {
      type: types.text
    , nullable: false
    }
  , salt: {
      type: types.text
    , nullable: false
    }
  , organization: {
      type: types.text
    , nullable: true
    }
  };

  definition.indices = {};

  return definition;
});