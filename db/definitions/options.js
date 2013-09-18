/**
 * Options Schema
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
  definition.name = 'options';

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
  , options_set_id: {
      type: types.int
    , nullable: false
    , references: {table: 'options_sets', column: 'id'}
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , price: {
      type: types.integer
    , nullable: true
    }
  , default_state: {
      type: types.bool
    , nullable: false
    , default: false
    }
  };

  definition.indices = {};

  return definition;
});
