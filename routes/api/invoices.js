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
