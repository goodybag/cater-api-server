/**
 * User Invoice Orders Schema
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
  definition.name = 'user_invoice_orders';

  definition.schema = {
    user_invoice_id:      { type: types.int , nullable: false , references: { table: 'user_invoices', column: 'id' } }
  , order_id:             { type: types.int , nullable: false , references: { table: 'orders', column: 'id' } }
  };

  definition.indices = {};

  definition.extras = ['primary key ("user_invoice_id", "order_id")'];

  return definition;
});
