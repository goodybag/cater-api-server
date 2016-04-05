var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var venter = require('../../lib/venter');

var route = module.exports = express.Router();

/**
 *  Orders resource.  The collection of all orders.
 */

route.get('/'
, m.restrict('admin')
, m.pagination({
    pageParam: 'p'
})
, m.param('status')
, m.param('type')
  // Cas IDs to ints so indexOf checks work
, function(req, res, next) {
    if (!Array.isArray(req.query['restaurants.region_id'])) return next();
    req.query['restaurants.region_id'] = req.query['restaurants.region_id'].map(function(id) {
      return parseInt(id);
    });

    // Setup the url->sql where clause
    return m.param('restaurants.region_id')(req, res, next);
  }
, m.param('contracted_status', function( value, where, options ){
    // Contracted status can only be contracted/non-contracted
    if ( ['contracted', 'non-contracted'].indexOf( value ) === -1 ){
      return;
    }

    where['restaurants.plan_id'] = {
      $null: value === 'non-contracted'
    };
  })
, m.sort('-id')
, m.queryOptions({
    submittedDate: true,
    applyPriceHike: {
      useCachedSubTotal: true
    },
    useLatestRevision: true,
    joins: [{
      type: 'left',
      target: 'restaurants',
      on: {
        id: '$orders.restaurant_id$'
      }
    }]
  })
, function(req, res, next) {
    res.locals.status = req.params.status;
    if (req.params.status == 'accepted') {
      req.queryOptions.statusDateSort = {
        status: req.params.status
      };
    }
    return next();
  }
, m.view('orders', db.orders)
);

route.post('/', m.restrict(['guest', 'client', 'admin']), m.geocodeBody(), controllers.orders.create);

route.all('/', function(req, res, next) {
  res.set('Allow', 'GET');
  res.send(405);
});

/**
 *  Order voice resource.  TwiML for phone notifications of order submitted.
 */

route.get('/:oid/voice', controllers.orders.voice);

route.all('/:oid/voice', function(req, res, next) {
  res.set('Allow', 'GET');
  res.send(405);
});


/**
 *  Order resource.  An individual order.
 */

route.get('/:oid/manifest',
  m.basicAuth(),
  m.restrict(['admin', 'receipts']),
  // always view this resource as the order-restaurant
  function( req, res, next ){
    req.user.attributes.groups.push('order-restaurant');
    return next();
  },
  m.getOrder2({
    items: true,
    manifest: true,
    user: true,
    restaurant: true,
    amenities: true
  }),
  m.view('order-manifest/manifest-1', {
    layout: 'order-manifest/layout'
  })
);

route.get('/:oid', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    restaurantRegionDeliveryServices: true,
    deliveryService: true,
    submittedDate: true,
    amenities: true,
    orderFeedback: true,
    manifest: true,
    applyPriceHike: true
  }), m.restrict(['admin', 'receipts', 'order-owner', 'order-restaurant']),
  controllers.orders.get);

route.put('/:oid', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true,
    applyPriceHike: true
  }), m.restrict(['order-owner', 'order-restaurant', 'admin']), m.audit.orderType(),
  controllers.orders.update);

route.patch('/:oid', m.getOrder2({
    param: 'oid',
    useLatestRevision: true
  }), m.restrict(['order-owner', 'order-restaurant', 'admin']), controllers.orders
  .editability, controllers.orders.update);

route.delete('/:oid', m.getOrder2({
  param: 'oid',
  items: true,
  user: true,
  userAddresses: true,
  userPaymentMethods: true,
  restaurant: true,
  deliveryService: true,
  applyPriceHike: true
}), m.restrict(['order-owner', 'order-restaurant', 'admin']), function(req, res,
  next) {
  req.body = {
    status: 'canceled'
  };
  next();
}, controllers.orders.changeStatus);

route.all('/:oid', m.restrict(['client', 'restaurant', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, POST, PUT, PATCH, DELETE');
  res.send(405);
});

/**
 *  Order status resource.  The collection of all statuses on a single order.
 */

route.get('/:oid/status-history', m.restrict(['client', 'admin']), controllers.orders.listStatus);

// people with restaurant review token can access this route.  leave auth t.
route.post('/:oid/status-history', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true
  }), m.restrict(['admin', 'order-owner', 'order-restaurant']), controllers.orders
  .changeStatus
);

route.all('/:oid/status-history', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, POST');
  res.send(405);
});

/**
 * Delivery service actions
 */
route.get('/:oid/delivery-service-accept', m.deliveryServiceAuth(), controllers.orders.deliveryServices.accept);

/**
 *  Order items resource.  The collection of all order items on a single order.
 *  This is a collection of OrderItems, not Items.
 */

route.get('/:oid/items', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    amenities: true,
    deliveryService: true,
    restaurantDbModelFind: true,
    applyPriceHike: true
  }), m.restrict(['admin', 'order-owner', 'order-editor']), controllers.orders.orderItems
  .summary
);

route.post('/:oid/items', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.editability, controllers.orders.orderItems.add
);

route.all('/:oid/items', function(req, res, next) {
  res.set('Allow', 'GET, POST');
  res.send(405);
});

/**
 *  Order item resource.  A single order item.
 */

route.get('/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.get); // not currently used

route.put('/:oid/items/:iid', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.editability, controllers.orders.orderItems.update
);

route.patch('/:oid/items/:iid', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.editability, controllers.orders.orderItems.update
);

route.delete(
  '/:oid/items/:iid', m.getOrder2({
    param: 'oid',
    items: true,
    user: true,
    userAddresses: true,
    userPaymentMethods: true,
    restaurant: true,
    deliveryService: true
  }), m.editOrderAuth, m.restrict(['admin', 'order-owner', 'order-editor']),
  controllers.orders.editability, controllers.orders.orderItems.remove
);

route.all('/:oid/items/:iid', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'GET, PUT, PATCH, DELETE');
  res.send(405);
});

/**
 * Order Duplicates resource.  Duplicates of an order.
 */

route.post('/:oid/duplicates', m.restrict(['client', 'admin']), controllers.orders.duplicate);

route.all('/:oid/duplicates', m.restrict(['client', 'admin']), function(req, res, next) {
  res.set('Allow', 'POST');
  res.send(405);
});

/**
 * Order add items resource.  Page to add items to an order.  (basically the menu page)
 */

route.get('/:oid/add-items', m.getOrder2({
    param: 'oid',
    restaurantDbModelFind: true,
    useLatestRevision: true,
    applyPriceHike: true
  }), m.restrict(['admin', 'order-owner', 'order-editor']), controllers.restaurants
  .orders.get
);


route.get('/:oid/notifications/:nid', m.restrict(['admin']), controllers.orders.notifications.getEmail);

route.get('/:oid/payment', m.getOrder2({
  param: 'oid',
  items: true,
  user: true,
  userAddresses: true,
  userPaymentMethods: true,
  restaurant: true,
  deliveryService: true,
  restaurantDbModelFind: true
}), m.restrict(['admin', 'order-owner']), m.view('order-payment', {}));
