/**
 * Invoiced Order Payment Transfers
 */

var dirac = require('dirac');
var types = require('../data-types')

var definition = module.exports;

definition.name = 'invoiced_order_payment_transfers';

definition.schema = {
  id:                   { type: types.serial, pk: true }
, order_id:             { type: types.int, nullable: false
                        , references: { table: 'orders', column: 'id' }
                        , onDelete: 'cascade'
                        }
, restaurant_id:        { type: types.int, nullable: false
                        , references: { table: 'restaurants', column: 'id' }
                        , onDelete: 'cascade'
                        }
, stripe_transfer_id:   { type: types.citext }
, error:                { type: types.jsonb }
, created_at:           { type: types.timestamp, nullable: false, default: 'now()' }
};

definition.indices = {};
definition.extras = [];