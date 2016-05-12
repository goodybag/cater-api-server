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
, invoice_status: ['pending', 'emailed', 'paid', 'error', 'expensed']
, pms_status:     ['pending', 'error', 'in-account', 'paid']
, timezone:       { type: 'domain', as: 'text check ( is_timezone( value ) )' }
, feedback_rating:{ type: 'domain', as: 'int check ( value > 0 and value < 6 )' }
, amenity_scale:  ['multiply', 'flat']
, plan_type:     config.availableRestaurantPlanTypes
};
