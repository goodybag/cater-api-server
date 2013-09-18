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
  definition.name = 'order_options';

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
  , order_options_set_id: {
      type: types.int
    , nullable: false
    , references: {table: 'order_options_sets', column: 'id'}
    }
  , option: {
      type: types.int
    , nullable: false
    , references: {table: 'options', column: 'id'}
    }
  , name: {
      type: types.text
    , nullable: false
    }
  , price: {
      type: types.integer
    , nullable: true
    }
  , state: {
      type: types.bool
    , nullable: false
    }
  };

  definition.indices = {};

  return definition;
});
