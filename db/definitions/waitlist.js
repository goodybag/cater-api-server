/**
 * Waitlist Schema
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
  definition.name = 'waitlist';

  definition.schema = {
    created_at: {
      type: types.timestamp
    , nullable: false
    , default: 'NOW()'
    }
  , email: {
      type: types.text
    , pk: true
    }
  , organization: {
      type: types.text
    , nullable: true
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
