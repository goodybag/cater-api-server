/**
 * Order Types Schema
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
  definition.name = 'order_types';

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
  , order_id: {
      type: types.int
    , nullable: false
    , references: {table: 'orders', column: 'id'}
    }
  , user_id: {
      type: types.int
    , references: {table: 'users', column: 'id'}
    }
  , type: {
      type: types.order_type
    , nullable: false
    , default: "'delivery'"
    }
  };

  definition.indices = {};

  return definition;
});
