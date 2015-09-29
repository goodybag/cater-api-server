var express = require('express');

var m = require('../middleware');
var db = require('../db');
var controllers = require('../controllers');
var config = require('../config');
var PMS = require('stamps/payment-summaries/db');

var route = module.exports = express.Router();

route.get( config.receipt.orderRoute
, m.basicAuth()
, m.restrict(['admin', 'receipts'])
, m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userPaymentMethods: true,
    restaurant: true,
    paymentMethod: true,
    amenities: true
  })
, m.view( 'invoice/receipt', {
    layout: 'invoice/invoice-layout'
  })
);

route.get('/receipts/order-:oid.pdf', m.s3({
  path: '/' + config.receipt.fileName,
  key: config.amazon.awsId,
  secret: config.amazon.awsSecret,
  bucket: config.receipt.bucket
}));


// Temporary for job fair
route.get('/fsjse.md', m.s3({
  path: '/fsjse-1.md',
  key: config.amazon.awsId,
  secret: config.amazon.awsSecret,
  bucket: config.cdn.bucket
}));

route.get('/jobs/customer-service-specialist.pdf', m.s3({
  path: '/customer-service-specialist-1.pdf',
  key: config.amazon.awsId,
  secret: config.amazon.awsSecret,
  bucket: config.cdn.bucket
}));

route.get('/manifests/manifest-:oid.pdf'
  // For now, don't restrict so I don't have to re-write the ?review_token mess
  // , m.restrict(['admin', 'restaurant'])
  , m.s3({
    path: '/manifest-:oid.pdf',
    key: config.amazon.awsId,
    secret: config.amazon.awsSecret,
    bucket: config.receipt.bucket
  })
);

route.get(config.invoice.pdfRoute, m.basicAuth(), m.restrict(['admin', 'receipts']), m.s3({
  path: '/' + config.invoice.fileFormat,
  key: config.amazon.awsId,
  secret: config.amazon.awsSecret,
  bucket: config.invoice.bucket
}));

route.get(
  config.invoice.htmlRoute, m.basicAuth(), m.restrict(['admin', 'receipts']),
  function(req, res, next) {
    var invoice = require('stamps/user-invoice')
      .create({
        id: req.params.id
      })
      .fetch(function(error) {
        if (error) return next(error);

        // So HBS doesn't screw EVERYTHING up
        res.locals.invoice = invoice.toJSON();

        return next();
      });
  }, m.view('invoice/invoice', {
    layout: 'invoice/invoice-layout'
  })
);

route.get('/payment-summaries/ps-:psid.pdf', m.restrict(['admin']), m.s3({
  path: '/payment-summary-:psid.pdf',
  key: config.amazon.awsId,
  secret: config.amazon.awsSecret,
  bucket: config.paymentSummaries.bucket
}));

route.get( config.paymentSummaries.route
, m.basicAuth()
, m.restrict(['admin', 'pms'])
, function( req, res, next ){
    PMS({ restaurant_id: req.params.restaurant_id, id: req.params.id })
      .fetch( function( error, pms ){
        if ( error ){
          return next( error );
        }

        pms.items = pms.getItems();
        pms.net_payout = pms.getTotalPayout();
        res.locals.payment_summary = pms;

        return next();
      });
  }
, m.view('invoice/payment-summary', {
    layout: 'invoice/invoice-layout'
  })
);
