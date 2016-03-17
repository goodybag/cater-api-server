var express = require('express');

var moment = require('moment-timezone');
var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var venter = require('../../lib/venter');
var errors = require('../../errors');

var route = module.exports = express.Router();

route.get('/'
, function( req, res, next ){
    if ( req.user.isGuest() ){
      return next( errors.auth.NOT_ALLOWED );
    }

    if ( !req.user.isAdmin() ){
      req.queryObj.user_id = req.user.attributes.id;
    }

    return next();
  }
, m.pagination()
, m.orderDateRange()
, m.param('status')
, function(req, res, next) {
  res.locals.status = req.params.status;
  if (req.query.status == 'accepted') {
    req.queryOptions.statusDateSort = {
      status: req.query.status
    };
  }
  return next();
}
, m.sort('-id')
, m.queryOptions({
    one: [{
      table: 'users',
      alias: 'user'
    }, {
      table: 'restaurants',
      alias: 'restaurant'
    }]
  })
, m.find(db.orders)
);

route.post('/'
, m.geocodeBody()
, m.copyMatchingAddress()
, controllers.orders.apiCreate
);

route.get('/search', function(req, res, next) {
  var query = req.query.q;
  if (!query) return next();
  req.queryObj.search_vector = {
    $partialMatches: query
  };
  req.queryObj.status = {
    $in: ['accepted', 'submitted', 'denied']
  };
  next();
}, m.sort('-id'), m.queryOptions({
  limit: 10,
  one: [{
    table: 'restaurants',
    alias: 'restaurant'
  }, {
    table: 'users',
    alias: 'user'
  }]
}), m.find(db.orders));

route.get('/:id', m.restrict(['admin']), m.getOrder2({
  param: 'id',
  items: true,
  user: true,
  userAddresses: true,
  userPaymentMethods: true,
  restaurant: true,
  paymentMethod: true,
  deliveryService: true
}), function(req, res) {
  res.json(req.order);
});

route.put('/silent/:id'
, m.restrict(['admin'])
, m.param('id')
, m.audit.orderType()
, m.after( m.trackOrderRevision({
    orderIdPath: 'res.locals.orders.0.id'
  }))
, function( req, res, next ){
    m.db.orders.update( req.params.id, req.body, {
      returning: ['*', {
        type: 'select',
        table: 'orders',
        columns: ['type'],
        alias: 'old_type',
        where: {
          id: '$orders.id$'
        }
      }]
    })( req, res, next );
  }
, m.sendJson('res.locals.orders.0')
);

route.put('/:id'
, m.getOrder2({
    param: 'id'
  , items: true
  , user: true
  , userAddresses: true
  , userPaymentMethods: true
  , restaurant: true
  , deliveryService: true
  , applyPriceHike: true
  })
, m.restrict(['order-owner', 'order-restaurant', 'admin'])
, m.audit.orderType()
, m.geocodeBody()
, m.copyMatchingAddress()
, controllers.orders.apiUpdate
);

route.delete('/:id', m.restrict(['admin']), m.param('id'), m.remove(db.orders));

route.get('/:id/delivery-fee', m.getOrder2({
  param: 'id',
  items: true,
  user: true,
  userAddresses: true,
  userPaymentMethods: true,
  restaurant: true,
  location: true,
  deliveryService: true
}), controllers.orders.getDeliveryFee);

route.get('/:oid/items', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true,
    applyPriceHike: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.orderItems.list
);

route.post('/:oid/items'
, m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true
  })
  , m.editOrderAuth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.orders.editability
  , controllers.orders.orderItems.add
);

/**
 *  Order item resource.  A single order item.
 */

route.get('/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.get); // not currently used

route.put('/:oid/items/:iid', m.getOrder2({
    param: 'oid',
    items: true,
    user: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.editability, controllers.orders.orderItems.update
);

route.patch('/:oid/items/:iid', m.getOrder2({
    param: 'oid',
    items: true,
    user: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.editability, controllers.orders.orderItems.update
);

route.delete(
  '/:oid/items/:iid', m.getOrder2({
    param: 'oid',
    items: true,
    user: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.editability, controllers.orders.orderItems.remove
);

route.all('/:oid/items/:iid', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, PUT, PATCH, DELETE');
  res.send(405);
});

route.post('/:oid/rebuild-pdf/:type', m.restrict(['admin']), controllers.orders.rebuildPdf);

route.get('/:oid/notifications', m.restrict(['admin']), controllers.orders.notifications.JSON.list);

route.post('/:oid/notifications/:id', m.restrict(['admin']), controllers.orders.notifications.JSON.sendNotification);

route.get('/:oid/notifications-history', m.restrict(['admin']), controllers.orders.notifications.JSON.history);

route.get('/:oid/notifications-history/:id', m.restrict(['admin']), controllers.orders.notifications.JSON.historyItem);

route.post('/:order_id/internal-notes', m.restrict(['admin']), function(req, res, next) {
  req.body.order_id = req.params.order_id;
  req.body.user_id = req.user.attributes.id;
  return next();
}, function(req, res, next) {
  req.queryOptions.returning = db.order_internal_notes.getColumnListForTimezone(
    req.user.attributes.region.timezone
  );

  return next();
}, function(req, res, next) {
  m.db.order_internal_notes.insert(req.body, req.queryOptions)(req, res, next);
}, function(req, res, next) {
  res.locals.order_internal_note.user = req.user.attributes;
  return next();
}, m.jsonLocals('order_internal_note'));

route.delete('/:order_id/internal-notes/:id', m.restrict(['admin']), m.param('id'), m.remove(db.order_internal_notes));

/**
 * Order amenities
 */

route.post('/:order_id/amenities', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.insert(db.order_amenities));

// list amenities per order
route.get('/:order_id/amenities', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.find(db.order_amenities));

// list specific order amenity
route.get('/:order_id/amenities/:amenity_id', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.param(
  'amenity_id'), m.find(db.order_amenities));

// delete all order amenities
route.delete('/:order_id/amenities', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.remove(db.order_amenities));

// delete specific order amenity
route.delete('/:order_id/amenities/:amenity_id', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.param('order_id'), m.param(
  'amenity_id'), m.remove(db.order_amenities));

/**
 * Order Feedback
 */
route.put('/:order_id/feedback', m.getOrder2({
  param: 'order_id'
}), m.restrict(['order-owner', 'admin']), m.queryOptions({
  returning: ['id']
}), m.param('order_id'), m.update(db.order_feedback));

/**
 * Duplicate order
 */

route.post('/:oid/duplicates', m.restrict(['client', 'admin']), controllers.orders.duplicate);
