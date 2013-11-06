/**
 * Transactions Schema
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
  definition.name = 'transaction_errors';

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
    , references: {table: 'orders', column: 'id', onDelete: 'set null'} // setting to null, because we don't want to automatically delete this
    }
  , request_id: {
      type: types.text
    , nullable: true
    }
  , data: {
      type: types.json
    , nullable: true
    }
  };

  definition.indices = {};

  return definition;
});
