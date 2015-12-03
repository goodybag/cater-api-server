var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var utils = require('../../utils');

var route = module.exports = express.Router();

/**
 * User Invoices
 */

 /**
  * @api {get} /invoices   Returns all user invoices.
  * @apiName GetInvoices
  * @apiGroup User Invoices
  * @apiPermission admin

  * @apiSuccess   {Object[]}   invoices                        List of all user invoices.
  * @apiSuccess   {Object}     invoices.id                     Invoice id.
  * @apiSuccess   {Object}     invoices.user_id                Invoice user id.
  * @apiSuccess   {Object}     invoices.billing_period_start   Invoice start of billing period.
  * @apiSuccess   {Object}     invoices.billing_period_end     Invoice end of billing period.
  * @apiSuccess   {Object}     invoices.status                 Invoice status.
  * @apiSuccess   {Object}     invoices.email_sent_date        Invoice data of email sent.
  * @apiSuccess   {Object}     invoices.created_at             Timestamp when invoice was created.
  **/
route.get('/', m.restrict(['admin']), m.sort('-id'), m.pagination({
  allowLimit: true
}), m.param('user_id'), m.param('from', function(value, $where, $options) {
  utils.defaults($where, {
    billing_period_start: {}
  });

  $where.billing_period_start.$gte = value;
}), m.param('to', function(value, $where, $options) {
  utils.defaults($where, {
    billing_period_end: {}
  });

  $where.billing_period_end.$lt = value;
}), m.find(db.user_invoices));

route.post('/', m.restrict(['admin']), m.insert(db.user_invoices));

/**
 * @api {get} /invoices/:id   Returns the specified user invoice.
 * @apiName GetInvoice
 * @apiGroup User Invoices
 * @apiPermission admin

 * @apiSuccess   {Object}     invoice                         Returned user invoice.
 * @apiSuccess   {Number}     invoice.id                      User invoice id.
 * @apiSuccess   {Number}     invoice.user_id                 Invoice id.
 * @apiSuccess   {String}     invoice.billing_period_start    Invoice datetime start of billing period.
 * @apiSuccess   {String}     invoice.billing_period_end      Invoice datetime end of billing period.
 * @apiSuccess   {String}     invoice.status                  Status of invoice.
 * @apiSuccess   {String}     invoice.email_sent_date         Datetime email notification was sent.
 * @apiSuccess   {String}     invoice.created_at              Timestamp when invoice was created.

 * @apiSuccess   {Object[]}   invoice.orders                            List of orders on invoice.
 * @apiSuccess   {Number}     invoice.orders.user_invoice_id            Order user invoice id.
 * @apiSuccess   {Number}     invoice.orders.order_id                   Order id.
 * @apiSuccess   {Number}     invoice.orders.id                         Order id.
 * @apiSuccess   {String}     invoice.orders.created_at                 Timestamp when order was created.
 * @apiSuccess   {Number}     invoice.orders.user_id                    Order user id.
 * @apiSuccess   {Number}     invoice.orders.restaurant_id              Order restaurant id.
 * @apiSuccess   {String}     invoice.orders.street                     Order address street.
 * @apiSuccess   {String}     invoice.orders.city                       Order address city.
 * @apiSuccess   {String}     invoice.orders.state                      Order address state.
 * @apiSuccess   {String}     invoice.orders.zip                        Order address zip.
 * @apiSuccess   {String}     invoice.orders.phone                      Order contact phone.
 * @apiSuccess   {String}     invoice.orders.notes                      Order notes.
 * @apiSuccess   {String}     invoice.orders.datetime                   Order datetime.
 * @apiSuccess   {String}     invoice.orders.timezone                   Order timezone.
 * @apiSuccess   {Number}     invoice.orders.guests                     Order number of guests.
 * @apiSuccess   {String}     invoice.orders.review_token               Order review token.
 * @apiSuccess   {Boolean}    invoice.orders.token_used                 "True" if token used.
 * @apiSuccess   {Number}     invoice.orders.adjustment_amount          Order adjustment amount.
 * @apiSuccess   {String}     invoice.orders.adjustment_description     Order adjustment description.
 * @apiSuccess   {Number}     invoice.orders.tip                        Order tip.
 * @apiSuccess   {String}     invoice.orders.name                       Order name.
 * @apiSuccess   {String}     invoice.orders.street2                    Order address street, second line.
 * @apiSuccess   {String}     invoice.orders.delivery_instructions      Order delivery instructions.
 * @apiSuccess   {String}     invoice.orders.tip_percent                Order tip percent.
 * @apiSuccess   {String}     invoice.orders.status                     Order status.
 * @apiSuccess   {String}     invoice.orders.cut                        Order cut.
 * @apiSuccess   {Number}     invoice.orders.payment_method_id          Order payment method id.
 * @apiSuccess   {String}     invoice.orders.payment_status             Order payment status.
 * @apiSuccess   {String}     invoice.orders.uuid                       Order uuid.
 * @apiSuccess   {String}     invoice.orders.reason_denied              Order reason denied.
 * @apiSuccess   {Boolean}    invoice.orders.reviewed                   "True" if order reviewed.
 * @apiSuccess   {String}     invoice.orders.edit_token                 Order edit token.
 * @apiSuccess   {String}     invoice.orders.edit_token_expires         Order edit token expires.
 * @apiSuccess   {Boolean}    invoice.orders.points_awarded             "True" if points awarded on order.
 * @apiSuccess   {Number}     invoice.orders.delivery_service_id        Order delivery service id.
 * @apiSuccess   {Number}     invoice.orders.sub_total                  Order subtotal.
 * @apiSuccess   {Number}     invoice.orders.sales_tax                  Order sales tax.
 * @apiSuccess   {Number}     invoice.orders.total                      Order total.
 * @apiSuccess   {Number}     invoice.orders.delivery_fee               Order delivery fee.
 * @apiSuccess   {String}     invoice.orders.pickup_datetime            Order pickup datetime.
 * @apiSuccess   {String}     invoice.orders.ds_token                   Order ds token.
 * @apiSuccess   {Boolean}    invoice.orders.ds_token_used              "True" if ds token on order used.
 * @apiSuccess   {String}     invoice.orders.type                       Order type.
 * @apiSuccess   {String}     invoice.orders.search_vector              Order search vector.
 * @apiSuccess   {Number}     invoice.orders.user_adjustment_amount     Order user adjustment amount.
 * @apiSuccess   {String}     invoice.orders.user_adjustment_description     Order user adjustmnet description.
 * @apiSuccess   {Number}     invoice.orders.restaurant_total           Order restaurant total.
 * @apiSuccess   {Number}     invoice.orders.restaurant_sales_tax       Order restaurant sales tax.
 * @apiSuccess   {Number}     invoice.orders.restaurant_location_id     Order restaurant location id.
 * @apiSuccess   {Number}     invoice.orders.no_contract_amount         Order no contract amount.
 * @apiSuccess   {String}     invoice.orders.secondary_contact_phone    Order secondary contact phone.
 * @apiSuccess   {String}     invoice.orders.promo_code                 Promo code used on order.
 * @apiSuccess   {String}     invoice.orders.address_name               Order address name.
 * @apiSuccess   {Object}     invoice.orders.lat_lng                    Order Latitude/longitude
 * @apiSuccess   {Number}     invoice.orders.priority_account_price_hike_percentage     Percentage on menu items for a priority account.

 * @apiSuccess   {Object}     invoice.user                       User account on invoice.
 * @apiSuccess   {Number}     invoice.user.id                    User id.
 * @apiSuccess   {String}     invoice.user.created_at            Timestamp when user account was created.
 * @apiSuccess   {String}     invoice.user.email                 User email.
 * @apiSuccess   {String}     invoice.user.password              User password.
 * @apiSuccess   {String}     invoice.user.organization          User organization
 * @apiSuccess   {String}     invoice.user.name                  User name.
 * @apiSuccess   {String}     invoice.user.balanced_customer_uri     User balanced customer uri.
 * @apiSuccess   {Boolean}    invoice.user.is_invoiced           "True" if account is invoiced.
 * @apiSuccess   {Number}     invoice.user.points                User total reward points.
 * @apiSuccess   {Number}     invoice.user.region_id             User region id.
 * @apiSuccess   {String}     invoice.user.default_zip           User default zipcode.
 * @apiSuccess   {String}     invoice.user.ordrin_email          *Obsolete crap*
 * @apiSuccess   {String}     invoice.user.ordrin_password       *Obsolete crap*
 * @apiSuccess   {Boolean}    invoice.user.is_tax_exempt         "True" if account is tax exempt.
 * @apiSuccess   {String}     invoice.user.user_agent            User agent information.
 * @apiSuccess   {String}     invoice.user.organization_type     User organization type.
 * @apiSuccess   {String}     invoice.user.stripe_id             User stripe id.
 * @apiSuccess   {Boolean}    invoice.user.is_deleted            "True" if account has been deactivated.
 * @apiSuccess   {Number}     invoice.user.priority_account_price_hike_percentage     Percentage on menu items for a priority account.
 **/
route.get('/:id', m.restrict(['admin']), m.param('id'), m.sort('-id'), m.queryOptions({
  one: [{
    table: 'users',
    alias: 'user'
  }],
  many: [{
    table: 'user_invoice_orders',
    alias: 'orders',
    mixin: [{
      table: 'orders'
    }]
  }]
}), m.findOne(db.user_invoices));

route.put('/:id', m.restrict(['admin']), m.param('id'), m.update(db.user_invoices));

route.delete('/:id', m.restrict(['admin']), m.param('id'), m.remove(db.user_invoices));

route.post('/:id/emails', m.restrict(['admin']), controllers.api.invoices.sendEmail);

route.post('/:id/emails/:email', m.restrict(['admin']), controllers.api.invoices.sendCustomEmail);

route.post('/:user_invoice_id/orders/:order_id', m.restrict(['admin']), m.queryToBody(
  'user_invoice_id'), m.queryToBody('order_id'), m.insert(db.user_invoice_orders));

route.delete('/:user_invoice_id/orders/:order_id', m.restrict(['admin']), m.param(
  'user_invoice_id'), m.param('order_id'), m.remove(db.user_invoice_orders));

route.post('/recipients', m.restrict(['admin']), m.insert(db.user_invoice_recipients));
