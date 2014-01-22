/**
 * Payment Summary Item Schema
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
  definition.name = 'payment_summary_items';

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
  , payment_summary_id: {
      type: types.int
    , nullable: false
    , references: { table: 'payment_summaries', column: 'id', onDelete: 'cascade' }
    }
  , order_id: {
      type: types.int
    , nullable: false
    , references: { table: 'orders', column: 'id', onDelete: 'cascade' }
    }
  , delivery_fee: {
      type: types.int
    , default: 0
    }
  , tip: {
      type: types.int
    , default: 0
    }
  , order_total: {
      type: types.int
    , default: 0
    }
  , delivery_fee: {
      type: types.int
    , default: 0
    }
  , sales_tax: {
      type: types.int
    , default: 0
    }
  };

  definition.indices = {};

  return definition;
});
