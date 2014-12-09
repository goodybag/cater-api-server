/**
 * Postgres enum types
 */

var config = require('../config');

module.exports = {
  order_status:   ['canceled', 'pending', 'submitted', 'denied', 'accepted', 'delivered']
, payment_method: ['card', 'bank']
, payment_type:   ['debit', 'credit']
, payment_status: ['pending', 'processing', 'paid', 'invoiced', 'error', 'ignore']
, tip_percentage: ['0', 'custom', '5', '10', '15', '18', '20', '25']
, email_status:   ['pending', 'delivered', 'error']
, job_status:     ['pending', 'in-progress', 'completed', 'failed']
, order_type:     ['pickup', 'delivery', 'courier']
, timezone:       { type: 'domain', as: 'text check ( is_timezone( value ) )' }
, amenity_scale:  ['multiply', 'flat']
, plan_types:     config.availableRestaurantPlanTypes
};
