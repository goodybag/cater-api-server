var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var venter = require('../../lib/venter');

var route = module.exports = express.Router();

route.get('/', m.restrict(['admin']), m.sort('-id'), m.param('region_id'), m.queryOptions({
  many: [],
  one: [{
    table: 'regions',
    alias: 'region'
  }]
}), m.find(db.restaurants));

route.post('/', m.restrict(['admin']), m.insert(db.restaurants));

route.get('/:id',
  m.restrict(['admin']),
  m.param('id', function(value, queryObj, queryOptions) {
    if (isNaN(+value)) {
      queryObj.text_id = value;
    } else {
      queryObj.id = value;
    }
  }),
  m.queryOptions({
    many: [{
      table: 'restaurant_hours',
      alias: 'hours'
    }, {
      table: 'restaurant_lead_times',
      alias: 'lead_times'
    }]
  }),
  m.findOne(db.restaurants));

route.put('/:id', m.restrict(['admin']), m.param('id'), m.update(db.restaurants));

route.patch('/:id', m.restrict(['admin']), m.param('id'), m.getRestaurant({
  param: 'id'
}), m.updateStripeCustomer({
  required: 'restaurant',
  pick: ['name']
}), m.update(db.restaurants));

route.delete('/:id', m.restrict(['admin']), m.param('id'), m.remove(db.restaurants));

route.post('/:id/auto-update', m.restrict(['admin']), m.getRestaurant({
  param: 'id',
  delivery: true
}), controllers.api.restaurants.autoPopulate);

route.get('/:restaurant_id/orders', m.restrict(['admin']), m.pagination({
  allowLimit: true
}), m.param('restaurant_id'), m.param('status'), m.param('start_date',
  function(value, $where, options) {
    $where.datetimeRange = $where.datetimeRange || {
      datetime: {}
    };
    $where.datetimeRange.datetime.$gte = value;
  }), m.param('end_date', function(value, $where, options) {
  $where.datetimeRange = $where.datetimeRange || {
    datetime: {}
  };
  $where.datetimeRange.datetime.$lt = value;
}), m.queryOptions({
  one: [{
    table: 'restaurants',
    alias: 'restaurant'
  }],
  many: [{
    table: 'order_items',
    alias: 'items'
  }]
}), m.find(db.orders));

route.get('/:restaurant_id/orders/current',
  function(req, res, next) {
    req.restaurant = {
      id: req.params.restaurant_id
    };
    next();
  },
  controllers.restaurants.orders.current,
  function(req, res, next) {
    if (req.order) {
      res.send(req.order);
    } else {
      next();
    }
  });

route.get('/:restaurant_id/contacts', m.restrict(['admin']), m.param(
  'restaurant_id'), m.find(db.contacts));

route.post('/:restaurant_id/contacts', m.restrict(['admin']), m.queryToBody(
  'restaurant_id'), m.insert(db.contacts));

route.put('/:restaurant_id/contacts/:id', m.restrict(['admin']), m.param(
  'restaurant_id'), m.param('id'), m.update(
  db.contacts));

route.delete('/:restaurant_id/contacts/:id', m.restrict(['admin']), m.param(
  'restaurant_id'), m.param('id'), m.remove(
  db.contacts));

route.get('/:restaurant_id/locations', m.pagination({
  allowLimit: true
}), m.param('restaurant_id'), m.find(db.restaurant_locations));

route.post('/:restaurant_id/locations', m.queryToBody('restaurant_id'), m.geocodeBody(),
  m.insert(db.restaurant_locations));

route.get('/:restaurant_id/locations/:id', m.param('id'), m.param('restaurant_id'),
  m.findOne(db.restaurant_locations));

route.put('/:restaurant_id/locations/:id', m.param('id'), m.param('restaurant_id'),
  function(req, res, next) {
    m.db.restaurant_locations.findOne(req.params.id)(req, res, next);
  }, m.geocodeBody({
    defaultsWith: 'restuarant_location'
  }), m.update(db.restaurant_locations));

route.delete('/:restaurant_id/locations/:id', m.param('id'), m.param(
  'restaurant_id'), m.remove(db.restaurant_locations));

route.get('/:restaurant_id/payment-summaries', m.pagination({
  allowLimit: true
}), m.param('restaurant_id'), m.find(db.payment_summaries));

route.post('/:restaurant_id/payment-summaries'
  // Ensure restaurant ID in the URL is what is in the body
  , m.queryToBody('restaurant_id'),
  function(req, res, next) {
    m.db.payment_summaries.insert(req.body)(req, res, next);
  }, m.after(function(req, res, next) {
    venter.emit(
      'payment-summary:change', res.locals.payment_summary.id, req.params
      .restaurant_id
    );

    next();
  }), m.jsonLocals('payment_summary')
);

route.get('/:restaurant_id/payment-summaries/:id', controllers.paymentSummaries.get);

route.put('/:restaurant_id/payment-summaries/:id', m.param('id'), m.param(
  'restaurant_id'), m.after(controllers
  .paymentSummaries.emitPaymentSummaryChange()), m.update(db.payment_summaries));

route.delete('/:restaurant_id/payment-summaries/:id', m.param('id'), m.param(
  'restaurant_id'), m.remove(db.payment_summaries));

route.post('/:restaurant_id/transfers', m.restrict(['accounting', 'admin']), m.getRestaurant({
  param: 'restaurant_id'
}), m.stripe.createRestaurantTransfer());

route.post('/:restaurant_id/payment-summaries/:payment_summary_id/send',
  controllers.paymentSummaries.send);

route.get('/:restaurant_id/payment-summaries/:payment_summary_id/items', m.pagination(),
  controllers.paymentSummaries
  .applyRestaurantId(), m.param('payment_summary_id'), m.queryOptions({
    one: [{
      table: 'orders',
      alias: 'order',
      one: [{
        table: 'delivery_services',
        alias: 'delivery_service'
      }, {
        table: 'restaurants',
        alias: 'restaurant'
      }]
    }]
  }), m.find(db.payment_summary_items)
);

route.post('/:restaurant_id/payment-summaries/:payment_summary_id/items', m.queryToBody(
    'payment_summary_id'),
  m.after(controllers.paymentSummaries.emitPaymentSummaryChange()), m.insert(
    db.payment_summary_items)
);

route.get('/:restaurant_id/payment-summaries/:payment_summary_id/items/:id',
  controllers.paymentSummaries.applyRestaurantId(),
  m.param('payment_summary_id'), m.param('id'), m.findOne(db.payment_summary_items)
);

route.put('/:restaurant_id/payment-summaries/:payment_summary_id/items/:id',
  controllers.paymentSummaries.applyRestaurantIdForNonJoins(),
  m.param('payment_summary_id'), m.param('id'), m.after(
    controllers.paymentSummaries.emitPaymentSummaryChange({
      idField: 'payment_summary_id'
    })
  ), m.update(db.payment_summary_items)
);

route.delete('/:restaurant_id/payment-summaries/:payment_summary_id/items/:id',
  controllers.paymentSummaries.applyRestaurantIdForNonJoins(),
  m.param('payment_summary_id'), m.param('id'), m.after(
    controllers.paymentSummaries.emitPaymentSummaryChange({
      idField: 'payment_summary_id'
    })
  ), m.remove(db.payment_summary_items)
);

route.get('/:restaurant_id/photos', m.restrict(['client', 'admin']), m.param(
  'restaurant_id'), m.find(db.restaurant_photos));

route.post('/:restaurant_id/photos', m.restrict('admin'), m.queryToBody(
    'restaurant_id'), m.sort('+priority'),
  m.insert(db.restaurant_photos)
);

route.get('/:restaurant_id/photos/:id', m.restrict(['client', 'admin']), m.param(
    'restaurant_id'), m.param('id'),
  m.findOne(db.restaurant_photos)
);

route.put('/:restaurant_id/photos/:id', m.restrict(['admin']), m.param(
  'restaurant_id'), m.param('id'), m.update(
  db.restaurant_photos));

route.delete('/:restaurant_id/photos/:id', m.restrict(['admin']), m.param(
  'restaurant_id'), m.param('id'), m.remove(
  db.restaurant_photos));

route.post('/:restaurant_id/notes', m.restrict(['admin']), m.insert(db.restaurant_notes));
