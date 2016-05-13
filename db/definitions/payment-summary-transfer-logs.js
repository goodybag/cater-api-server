/**
 * Payment Summary Transfer Logs
 */

var dirac = require('dirac');
var types = require('../data-types')

var definition = module.exports;

definition.name = 'payment_summary_transfer_logs';

definition.schema = {
  id:                   { type: types.serial, pk: true }
, payment_summary_id:   { type: types.int, nullable: false
                        , references: { table: 'payment_summaries', column: 'id' }
                        , onDelete: 'set null'
                        }
, status:               { type: types.pms_status, nullable: false, default: "'pending'" }
, data:                 { type: types.jsonb, nullable: false, default: "'{}'::jsonb" }
, created_at:           { type: types.timestamp, nullable: false, default: 'now()' }
};

definition.indices = {};
definition.extras = [];
