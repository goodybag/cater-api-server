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
  definition.name = 'transactions';

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
  , type: {
      type: types.paymenttype
    , nullable: false
    }
  , order_id: {
      type: types.int
    , nullable: false
    , references: {table: 'orders', column: 'id', onDelete: 'cascade'}
    }
  , uri: {
      type: types.text
    , nullable: false
    , unique: true
    }
  , data: {
      type: types.json
    , nullable: true
    }
  };

  definition.indices = {};

  return definition;
});
