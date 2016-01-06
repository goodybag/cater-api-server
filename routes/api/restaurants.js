var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var venter = require('../../lib/venter');

var route = module.exports = express.Router();

route.get('/'
, m.restrict(['admin'])
, m.sort('-id')
, m.param('region_id')
, m.queryOptions({
    many: [],
    one: [{
      table: 'regions',
      alias: 'region'
    }]
  })
, m.find(db.restaurants)
);

route.post('/', m.restrict(['admin']), m.insert(db.restaurants));

route.get('/:id'
, m.restrict(['admin'])
, m.getRestaurant({
    param: 'id'
  , stripe: true
  })
, m.jsonLocals('restaurant')
);

route.put('/:id', m.restrict(['admin']), m.param('id'), m.update(db.restaurants));

route.patch('/:id'
, m.restrict(['admin'])
, m.param('id')
, m.getRestaurant({
    param: 'id'
  })
, m.updateStripeCustomer({
    required: 'restaurant',
    pick: ['name']
  })
, m.update(db.restaurants)
);

route.delete('/:id', m.restrict(['admin']), m.param('id'), m.remove(db.restaurants));

route.post('/:id/auto-update', m.restrict(['admin']), m.getRestaurant({
  param: 'id',
  delivery: true
}), controllers.api.restaurants.autoPopulate);

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

route.post('/:restaurant_id/payment-summaries/:id/send', controllers.paymentSummaries.send);

route.post('/:restaurant_id/transfers', m.restrict(['accounting', 'admin']), m.getRestaurant({
  param: 'restaurant_id'
}), m.stripe.createRestaurantTransfer());

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

route.get('/:restaurant_id/items',
  m.param('restaurant_id'),
  function(req, res, next) {
    req.queryObj.is_hidden = false;
    next();
  },
  m.find(db.items));

route.get('/:restaurant_id/menu',
  m.param('restaurant_id'),
  function(req, res, next) {
    req.queryObj.is_hidden = false;
    next();
  },
  m.queryOptions({
    many: [{
      table: 'items',
      where: {
        is_hidden: false
      },
      pluck: [{
        table: 'item_tags',
        column: 'tag',
        alias: 'tags'
      }]
    }]
  }),
  m.find(db.categories));

route.get('/:restaurant_id/categories',
  m.param('restaurant_id'),
  function(req, res, next) {
    req.queryObj.is_hidden = false;
    next();
  },
  m.find(db.categories));

route.get('/:restaurant_id/orders',
  function(req, res, next) {
    req.queryObj.user_id = req.query.user_id;
    next();
  },
  m.param('restaurant_id'),
  m.sort('-datetime'),
  m.queryOptions({
    many: [{
      table: 'order_items',
      alias: 'items'
    }]
  }),
  m.find(db.orders));

route.get('/:id/bank-account'
, m.restrict(['admin'])
, controllers.api.restaurants.getBankAccount
);

route.put('/:id/bank-account'
, m.restrict(['admin'])
, controllers.api.restaurants.updateBankAccount
);
