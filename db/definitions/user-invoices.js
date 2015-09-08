/**
 * User Invoices Schema
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
  definition.name = 'user_invoices';

  definition.schema = {
    id:                   { type: types.serial, nullable: false, pk: true }
  , user_id:              { type: types.int , nullable: false , references: { table: 'users', column: 'id' } }
  , billing_period_start: { type: types.date, nullable: false }
  , billing_period_end:   { type: types.date, nullable: false }
  , status:               { type: types.invoice_status, nullable: false, default: "'pending'" }
  , email_sent_date:      { type: types.date }
  , created_at:           { type: types.timestamp, nullable: false, default: 'now()' }
  };

  definition.indices = {};

  return definition;
});
