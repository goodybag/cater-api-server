/**
 * Reminders Schema
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
  definition.name = 'reminders';

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
  , name: {
      type: types.text
    , nullable: false
    }
  , data: {
      type: types.json
    , default: "'{}'"
    }
  };

  definition.indices = {};

  return definition;
});
