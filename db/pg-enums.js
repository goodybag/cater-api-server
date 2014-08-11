/**
 * Postgres enum types
 */

module.exports = {
  order_status:   ['canceled', 'pending', 'submitted', 'denied', 'accepted', 'delivered']
, payment_method: ['card', 'bank']
, payment_type:   ['debit', 'credit']
, payment_status: ['pending', 'processing', 'paid', 'invoiced', 'error']
, tip_percentage: ['0', 'custom', '5', '10', '15', '18', '20', '25']
, email_status:   ['pending', 'delivered', 'error']
, job_status:     ['pending', 'in-progress', 'completed', 'failed']
, order_type:     ['pickup', 'delivery', 'courier']
};