/**
 * Order Notification History View
 */

var types = require('../data-types');
var orderRecord = require('../../lib/order-record');

var definition = module.exports;

definition.name = 'order_notification_history';

definition.schema = {
  order_id:             { type: types.int, nullable: false
                        , references: { table: 'orders', column: 'id' }
                        }
  // For extra indexing and ease of lookup
, user_id:              { type: types.int
                        , references: { table: 'users', column: 'id' }
                        }
, data:                 { type: types.jsonb, nullable: false, default: "'{}'::jsonb" }
, error:                { type: types.jsonb, nullable: false, default: "'{}'::jsonb" }
, created_at:           { type: types.timestamp, nullable: false, default: 'now()' }
};

definition.indices = {};
definition.extras = [];
