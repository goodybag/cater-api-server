var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var utils = require('../../utils');
var controllers = require('../../controllers');
var paletteParser = require('../../lib/parse-palette-from-variables');
var Datetime = require('stamps/datetime');

var route = module.exports = express.Router();

route.use(m.restrict('admin'));

route.get('/',
  m.viewPlugin('mainNav', {
    active: 'home'
  }),
  m.view('admin/home', {
    layout: 'admin/layout2'
  }));

route.get('/query-inspector',
  m.view('admin/query-inspector', {
    layout: 'admin/layout2'
  }));

route.get('/upcoming',
  m.getOrders({
    submittedDate: true,
    upcoming: '3 hours'
  }),
  m.view('admin/upcoming', {
    layout: 'admin/layout2'
  }));

/**
 * Regions
 */

route.get('/regions',
  m.viewPlugin('mainNav', {
    active: 'regions'
  }),
  m.sort('+name'),
  m.view('admin/regions',
    db.regions, {
      layout: 'admin/layout2',
      method: 'find',
      activeTab: 'regions'
    }));

/**
 * Kitchen Sink
 */

route.get('/kitchen-sink',
  m.filters(['regions', 'restaurant-visibility', 'restaurant-sort']),
  getPalette, // TODO: break these out into a middleware module
  getLabelTags,
  m.db.restaurants.find({
    is_hidden: false
  }),
  m.aliasLocals({
    ordersTableRestaurants: 'restaurants'
  }),
  m.view('admin/kitchen-sink/index', {
    layout: 'admin/layout2'
  }));

route.get('/kitchen-sink/affix',
  m.view('admin/kitchen-sink/affix', {
    layout: null
  }));

/**
 * Restaurant Plans
 */

route.get('/restaurant-plans',
  m.sort('+name'),
  m.viewPlugin('section', {
    url: '/admin/restaurant-plans'
  }),
  m.viewPlugin('collection', {
    path: 'app/collections/restaurant-plans'
  }),
  m.viewPlugin('mainNav', {
    active: 'restaurant-plans'
  }),
  m.view('admin/restaurant-plans/list',
    db.restaurant_plans, {
      layout: 'admin/layout2',
      method: 'find'
    }));

route.get('/restaurant-plans/new',
  m.db.regions.find({}, {
    limit: 'all'
  }),
  m.viewPlugin('section', {
    url: '/admin/restaurant-plans'
  }),
  m.viewPlugin('mainNav', {
    active: 'restaurant-plans'
  }),
  m.viewPlugin('sidebarNav', {
    active: 'basic-info',
    baseUrl: '/admin/restaurant-plans',
    isNew: true
  }),
  m.viewPlugin('itemForm', {
    selector: '#create-item-form',
    collection: 'app/collections/restaurant-plans',
    localModelProp: 'restaurant_plan'
  }),
  m.view('admin/restaurant-plans/new-item', {
    layout: 'admin/layout-single-object'
  }));

route.get('/restaurant-plans/:id',
  m.redirect('/admin/restaurant-plans/:id/basic-info'));

route.get('/restaurant-plans/:id/basic-info',
  m.param('id'),
  m.db.regions.find({}, {
    limit: 'all'
  }),
  m.viewPlugin('section', {
    url: '/admin/restaurant-plans'
  }),
  m.viewPlugin('mainNav', {
    active: 'restaurant-plans'
  }),
  m.viewPlugin('sidebarNav', {
    active: 'basic-info',
    baseUrl: '/admin/restaurant-plans/:id'
  }),
  m.viewPlugin('itemForm', {
    selector: '#edit-item-form',
    collection: 'app/collections/restaurant-plans',
    localModelProp: 'restaurant_plan'
  }),
  m.view('admin/restaurant-plans/edit-item', db.restaurant_plans, {
    layout: 'admin/layout-single-object',
    method: 'findOne'
  }));

/**
 * Delivery Services
 */

route.get('/delivery-services',
  m.sort('+name'),
  m.queryOptions({
    one: [{
      table: 'regions',
      alias: 'region'
    }]
  }),
  m.viewPlugin('collection', {
    path: 'app/collections/delivery-services'
  }),
  m.viewPlugin('mainNav', {
    active: 'delivery-services'
  }),
  m.view('admin/delivery-service/list', db.delivery_services, {
    layout: 'admin/layout2',
    method: 'find'
  }));

route.get('/delivery-services/new', m.db.regions.find({}, {
  limit: 'all'
}), m.viewPlugin('mainNav', {
  active: 'delivery-services'
}), m.viewPlugin('sidebarNav', {
  active: 'basic-info',
  baseUrl: '/admin/delivery-services',
  isNew: true
}), m.viewPlugin('itemForm', {
  selector: '#create-item-form',
  collection: 'app/collections/delivery-services',
  localModelProp: 'delivery_service'
}), m.view('admin/delivery-service/new-item', {
  layout: 'admin/layout-single-object'
}));

route.get('/delivery-services/:id', m.redirect('/admin/delivery-services/:id/basic-info'));

route.get('/delivery-services/:id/basic-info', m.param('id'), m.db.regions.find({}, {
  limit: 'all'
}), m.queryOptions({
  one: [{
    table: 'regions',
    alias: 'region'
  }]
}), m.viewPlugin('mainNav', {
  active: 'delivery-services'
}), m.viewPlugin('sidebarNav', {
  active: 'basic-info',
  baseUrl: '/admin/delivery-services/:id'
}), m.viewPlugin('breadCrumbs', {
  currentPage: 'basic-info'
}), m.viewPlugin('itemForm', {
  selector: '#edit-item-form',
  collection: 'app/collections/delivery-services',
  collectionOptions: {},
  localModelProp: 'delivery_service'
}), m.view('admin/delivery-service/basic-info', db.delivery_services, {
  layout: 'admin/layout-single-object',
  method: 'findOne'
}));

route.get('/delivery-services/:id/delivery-zips', m.param('id'), m.db.regions.find({}, {
  limit: 'all'
}), m.queryOptions({
  one: [{
    table: 'regions',
    alias: 'region'
  }]
}), m.queryOptions({
  many: [{
    table: 'delivery_service_zips',
    alias: 'zips'
  }]
}), m.viewPlugin('mainNav', {
  active: 'delivery-services'
}), m.viewPlugin('sidebarNav', {
  active: 'delivery-zips',
  baseUrl: '/admin/delivery-services/:id'
}), m.viewPlugin('breadCrumbs', {
  currentPage: 'delivery-zips'
}), m.view('admin/delivery-service/delivery-zips', db.delivery_services, {
  layout: 'admin/layout-single-object',
  method: 'findOne'
}));

/**
 * Users list
 */


route.get('/users', m.sort('-id'), m.queryOptions({
  one: [{
    table: 'regions',
    alias: 'region'
  }]
}), m.viewPlugin('mainNav', {
  active: 'users'
}), m.view('admin/user/list', db.users, {
  layout: 'admin/layout2',
  method: 'find'
}));

route.get('/users/new'
, m.param('id')
, m.db.regions.find({}, {
    limit: 'all'
  })
, m.viewPlugin('mainNav', {
    active: 'users'
  })
, m.db.delivery_services.find({})
, m.view('admin/user/create', {
    layout: 'admin/layout2',
    edit_user: {}
  })
);

route.get('/users/:id', m.redirect('/admin/users/:id/basic-info'));

route.get('/users/:id/basic-info'
, m.param('id')
, m.viewPlugin('mainNav', {
    active: 'users'
  })
, m.viewPlugin('sidebarNav', {
    active: 'basic-info',
    baseUrl: '/admin/users/:id'
  })
, m.viewPlugin('breadCrumbs', {
    currentPage: 'Basic Info'
  })
, m.queryOptions({
    one: [{
      table: 'regions',
      alias: 'region',
      many: [{ table: 'delivery_services' }]
    }],
    pluck: [
      { table: 'user_courier_preferences'
      , alias: 'courier_preferences'
      , column: 'delivery_service_id'
      }
    ],
    userGroups: true
  })
, m.db.regions.find({}, {
    limit: 'all'
  })
, m.viewPlugin('mainNav', {
    active: 'users'
  })
, m.view('admin/user/edit', db.users, {
    layout: 'admin/layout-single-object',
    method: 'findOne',
    localsAlias: 'edit_user'
  })
);

route.get('/users/:id/invoices', m.param('id'), m.viewPlugin('mainNav', {
  active: 'users'
}), m.viewPlugin('sidebarNav', {
  active: 'invoices',
  baseUrl: '/admin/users/:id'
}), m.viewPlugin('breadCrumbs', {
  currentPage: 'Invoices'
}), m.queryOptions({
  one: [{
    table: 'regions',
    alias: 'region'
  }],
  many: [{
    table: 'user_invoice_recipients',
    alias: 'invoice_recipients'
  }],
  userGroups: true
}), m.getInvoices({
  userIdParam: 'id'
}), m.db.regions.find({}, {
  limit: 'all'
}), m.viewPlugin('mainNav', {
  active: 'users'
}), m.view('admin/user/invoices', db.users, {
  layout: 'admin/layout-single-object',
  method: 'findOne',
  localsAlias: 'edit_user'
}));

route.get('/users/:id/invoice-recipients', m.param('id'), m.viewPlugin('mainNav', {
  active: 'users'
}), m.viewPlugin('sidebarNav', {
  active: 'invoice-recipients',
  baseUrl: '/admin/users/:id'
}), m.viewPlugin('breadCrumbs', {
  currentPage: 'Invoice Recipients'
}), m.queryOptions({
  many: [{
    table: 'user_invoice_recipients',
    alias: 'invoice_recipients',
    order: { id: 'desc' }
  }]
}), m.view('admin/user/invoice-recipients', db.users, {
  layout: 'admin/layout-single-object',
  method: 'findOne',
  localsAlias: 'edit_user'
}));

/**
 * Invoices standalone
 */

route.get('/invoices', m.getInvoices(), m.db.regions.find({}, {
  limit: 'all'
}), m.view('admin/invoices', db.users, {
  layout: 'admin/layout2',
  method: 'findOne'
}));

/**
 * Restaurant list
 */

route.get('/restaurants', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.filters([
  'regions', 'restaurant-visibility', 'restaurant-sort'
]), m.getRestaurants(), m.view('admin/restaurant/edit-restaurants', {
  layout: 'admin/layout-page'
}));

/**
 * Restaurant create
 */

route.get('/restaurants/create', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.states(), m.db.regions.find({}, {
  limit: 'all'
}), m.view('admin/restaurant/create', {
  layout: 'admin/layout-page'
}));

route.post('/restaurants/create', controllers.restaurants.create);

/**
 * Restaurant edit resource
 */

route.get('/restaurants/:id', m.param('id'), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'dashboard',
  baseUrl: '/admin/restaurants/:id'
}), m.getRestaurant({
  param: 'id',
  notes: true
}), m.view('admin/restaurant/edit-dashboard', {
  layout: 'admin/layout-two-column',
  method: 'findOne'
}));

route.put('/restaurants/:rid', controllers.restaurants.update);

route.get('/restaurants/:id/dashboard', m.param('id'), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'dashboard',
  baseUrl: '/admin/restaurants/:id'
}), m.getRestaurant({
  param: 'id',
  notes: true
}), m.view('admin/restaurant/edit-dashboard', {
  layout: 'admin/layout-two-column',
  method: 'findOne'
}));

route.get('/restaurants/:id/basic-info', m.param('id'), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'basic-info',
  baseUrl: '/admin/restaurants/:id'
}), m.db.regions.find({}, {
  limit: 'all'
}), m.view('admin/restaurant/edit-basic-info', db.restaurants, {
  layout: 'admin/layout-two-column',
  method: 'findOne'
}));

route.get('/restaurants/:id/billing-info'
, m.viewPlugin('mainNav', {
    active: 'restaurants'
  })
, m.viewPlugin('sidebarNav', {
    active: 'billing-info',
    baseUrl: '/admin/restaurants/:id'
  })
, m.states()
, m.db.regions.find({}, { limit: 'all' })
, m.db.restaurant_plans.find({}, { limit: 'all' })
, m.getRestaurant({
    param:    'id'
  , contacts: true
  , stripe:   true
  })
, m.view('admin/restaurant/edit-billing-info', {
    layout: 'admin/layout-two-column'
  })
);

route.get('/restaurants/:id/transfers', m.param('id'), m.getRestaurant({
  param: 'id'
}), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'transfers',
  baseUrl: '/admin/restaurants/:id'
}), m.stripe.getRestaurantTransfers(), m.view('admin/restaurant/edit-transfers', db.restaurants, {
  layout: 'admin/layout-two-column',
  method: 'findOne'
}));

route.get('/restaurants/:rid/delivery-settings', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'delivery-settings',
  baseUrl: '/admin/restaurants/:rid'
}), m.restaurant({
  param: 'rid'
}), m.view('admin/restaurant/edit-delivery-settings', {
  layout: 'admin/layout-two-column'
}));

route.get('/restaurants/:rid/pickup-settings', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'pickup-settings',
  baseUrl: '/admin/restaurants/:rid'
}), m.restaurant({
  param: 'rid'
}), m.view('admin/restaurant/edit-pickup-settings', {
  layout: 'admin/layout-two-column'
}));


route.get('/restaurants/:rid/courier-settings', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'courier-settings',
  baseUrl: '/admin/restaurants/:rid'
}), m.restaurant({
  param: 'rid'
}), m.view('admin/restaurant/edit-courier-settings', {
  layout: 'admin/layout-two-column'
}));


route.get('/restaurants/:rid/tags', m.enums(), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'tags',
  baseUrl: '/admin/restaurants/:rid'
}), m.restaurant({
  param: 'rid'
}), m.view('admin/restaurant/edit-tags', {
  layout: 'admin/layout-two-column'
}));

route.get('/restaurants/:rid/address', m.states(), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'address',
  baseUrl: '/admin/restaurants/:rid'
}), m.restaurant({
  param: 'rid'
}), m.view('admin/restaurant/edit-address', {
  layout: 'admin/layout-two-column'
}));

route.get('/restaurants/:restaurant_id/contacts', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'contacts',
  baseUrl: '/admin/restaurants/:restaurant_id'
}), m.param('restaurant_id'), m.sort('+id'), m.restaurant({
  param: 'restaurant_id'
}), m.view('admin/restaurant/edit-contacts', db.contacts, {
  layout: 'admin/layout-two-column',
  method: 'find'
}));

route.get('/restaurants/:rid/menu', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'menu',
  baseUrl: '/admin/restaurants/:rid'
}), m.restaurant({
  param: 'rid',
  withMenuItems: true
}), m.view('admin/restaurant/edit-menu', {
  layout: 'admin/layout-two-column'
}));

route.get('/restaurants/:id/amenities', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'amenities',
  baseUrl: '/admin/restaurants/:id'
}), m.param('id'), m.queryOptions({
  many: [{
    table: 'amenities'
  }]
}), m.view('admin/restaurant/edit-amenities', db.restaurants, {
  layout: 'admin/layout-two-column',
  method: 'findOne'
}));

route.get('/restaurants/:restaurant_id/photos', m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'photos',
  baseUrl: '/admin/restaurants/:restaurant_id'
}), m.restaurant({
  param: 'restaurant_id'
}), m.param('restaurant_id'), m.sort('+priority'), m.view('admin/restaurant/edit-photos', db.restaurant_photos, {
  layout: 'admin/layout-two-column',
  method: 'find'
}));

route.get('/restaurants/:rid/sort', controllers.restaurants.sort);

route.get('/restaurants/:id/widgets'
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.viewPlugin( 'sidebarNav', {
      active:   'widgets'
    , baseUrl:  '/admin/restaurants/:id'
    })
  , m.param('id')
  , m.view('admin/restaurant/widgets', db.restaurants, {
      layout: 'admin/layout-two-column'
    , method: 'findOne'
    })
  );

/**
 * Restaurant copy
 */

route.get('/restaurants/:restaurant_id/copy', controllers.restaurants.copy);

route.get('/restaurants/:id/locations', m.param('id'), m.queryOptions({
  one: [{
    table: 'regions',
    alias: 'region'
  }],
  many: [{
    table: 'restaurant_locations',
    alias: 'locations',
    order: ['is_default desc', 'name asc']
  }]
}), m.viewPlugin('sidebarNav', {
  active: 'locations',
  baseUrl: '/admin/restaurants/:id'
}), m.viewPlugin('collection', {
  path: 'app/collections/restaurant-locations'
}), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.view('admin/restaurant/locations-list', db.restaurants, {
  layout: 'admin/layout-single-object',
  method: 'findOne'
}));

route.get('/restaurants/:id/locations/new', m.param('id'), m.queryOptions({
  one: [{
    table: 'regions',
    alias: 'region'
  }]
}), m.states(), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'locations',
  baseUrl: '/admin/restaurants/:id'
}), m.viewPlugin('itemForm', {
  selector: '#create-item-form',
  collection: 'app/collections/restaurant-locations',
  collectionOptions: {
    restaurant_id: ':id'
  }
}), m.view('admin/restaurant/location-new', db.restaurants, {
  layout: 'admin/layout-single-object',
  method: 'findOne'
}));

route.get('/restaurants/:restaurant_id/locations/:id', m.param('restaurant_id'), m.param('id'), m.states(), m.queryOptions({
  one: [{
    table: 'regions',
    alias: 'region'
  }]
}), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'locations',
  baseUrl: '/admin/restaurants/:restaurant_id'
}), m.viewPlugin('breadCrumbs', {
  currentPage: 'New Invoice'
}), m.viewPlugin('itemForm', {
  selector: '#edit-item-form',
  collection: 'app/collections/restaurant-locations',
  localModelProp: 'restaurant_location',
  collectionOptions: {
    restaurant_id: ':restaurant_id'
  }
}), function(req, res, next) {
  return m.db.restaurants.findOne(req.params.restaurant_id)(req, res, next);
}, m.view('admin/restaurant/location-edit', db.restaurant_locations, {
  layout: 'admin/layout-single-object',
  method: 'findOne'
}));

route.get('/restaurants/:rid/menu.csv', controllers.restaurants.menuCsv);

function getLabelTags(req, res, next) {
  var not = ['white', 'gray-lighter', 'tan'];

  res.locals.labelTags = res.locals.palette.filter(function(palette) {
      return not.indexOf(palette.name) === -1;
    })
    .map(function(palette) {
      return palette.name;
    })
    .concat([
      'pending', 'submitted', 'delivered', 'canceled', 'accepted', 'denied'
    ]);

  next();
}

function getPalette(req, res, next) {
  paletteParser.parse(function(err, palette) {
    if (err) return next(err);

    res.locals.palette = palette;

    next();
  });
}

route.get('/restaurants/:restaurant_id/orders'
, function( req, res, next ){
    m.db.restaurants.findOne( req.params.restaurant_id )( req, res, next );
  }
, m.param('status')
, m.param('restaurant_id')
, m.sort('-id')
, m.queryOptions({ limit: 'all'
  , one:  [ { table: 'users', alias: 'user' }
          , { table: 'restaurants', alias: 'restaurant'
            , one:  [ { table: 'delivery_services'
                    , alias: 'delivery_service'
                    , where: { region_id: '$restaurants.region_id$' }
                    }
                    ]
            }
          ]
  })
, function( req, res, next ){
    res.locals.status = req.params.status;
    if ( req.params.status == 'accepted' ){
      req.queryOptions.statusDateSort = { status: req.params.status };
    }
    return next();
  }
, m.view( 'restaurant-orders', db.orders, {
    method: 'find'
  })
);


route.get('/restaurants/:id/payment-summaries'
, m.restrict(['admin'])
, m.param('id')
, m.queryOptions({
    many: [ { table: 'payment_summaries'
            , order: { period_end: 'desc' }
            }
          , { table: 'contacts'
            , where: { receives_payment_summaries: true }
            }
          ]
  })
, m.viewPlugin('mainNav', {
    active: 'restaurants'
  })
, m.viewPlugin('sidebarNav', {
    active: 'payment-summaries',
    baseUrl: '/admin/restaurants/:id'
  })
, m.view( 'admin/restaurant/payment-summaries', db.restaurants, {
    layout: 'admin/layout-single-object'
  , method: 'findOne'
  })
);

route.get('/restaurants/:restaurant_id/contacts'
, m.restrict(['admin'])
, m.param('restaurant_id')
, m.restaurant( {param: 'restaurant_id'} )
, m.view( 'restaurant/contacts', db.contacts, {
   layout: 'admin/layout2'
 , method: 'find'
 })
);

route.get('/orders/:id'
, m.restrict(['admin'])
  // Lookup couriers
, function( req, res, next ){
    var where = {
      where: { 'orders.id': req.params.id }
    };

    var options = {
      columns: ['delivery_services.*']

    , joins: [
        { type: 'left', target: 'restaurants',        on: { 'orders.restaurant_id': '$restaurants.id$' } }
      , { type: 'left', target: 'regions',            on: { 'restaurants.region_id': '$regions.id$' } }
      , { type: 'left', target: 'delivery_services',  on: { 'regions.id': '$delivery_services.region_id$' } }
      ]
    };

    return m.db.orders.find( where, options )( req, res, next );
  }
  // previous query aliased result as `orders`
  // it should be `delivery_services`
, m.aliasLocals({ delivery_services: 'orders' })

, m.getOrder2({
    param:                  'id'
  , location:               true
  , restaurant:             true
  , restaurantContacts:     true
  , restaurantDbModelFind:  true
  , user:                   true
  , userPaymentMethods:     true
  , items:                  true
  , internalNotes:          true
  , alerts:                 true
  , applyPriceHike:         true
  })

  // Lookup the restaurants in the order region
, function( req, res, next ){
    return m.db.restaurants.find({
      region_id: req.order.restaurant.region_id
    }, {
      order: { name: 'asc' }
    })( req, res, next );
  }

, m.db.users.find(
    { name: { $ne: { $or: ['', null] } } }
  , { order: ['organization asc', 'name asc'] }
  )

, m.view( 'admin/order', {
    layout: 'admin/layout2'
  })
);


route.get('/analytics'
, m.restrict(['admin'])
, m.getOrders({
    status: 'accepted'
  , submittedDate: { ignoreColumn: true }
  , groupByMonth: true
  , rename: 'stats'
  , user: false
  , restaurant: false
  , reverse: true
  })
, m.view( 'admin/analytics/index.hbs', {
    layout: 'admin/layout2'
  })
);

route.get('/analytics/demand'
, m.restrict(['admin'])
, m.filters(['regions'])
, m.defaultPeriod(['month', 'year'])
, m.getOrders({
    status: 'accepted'
  , submittedDate: true
  , order: 'submitted'
  , getWeek: true
  , indexBy: 'week'
  })
, m.orderAnalytics.period()
, m.orderAnalytics.month()
, m.orderAnalytics.week()
, m.view( 'admin/analytics/demand', {
    layout: 'admin/layout2'
  })
);

route.get('/analytics/retention'
, m.restrict(['admin'])
, m.filters([ 'regions' ])
, m.organizationSubmissions()
, m.orderAnalytics.retention()
, m.view( 'admin/analytics/retention', {
    layout: 'admin/layout2'
  })
);

route.get('/payment-summaries'
, function( req, res, next ){
    var p1 = Datetime().getBillingPeriod();
    var p2 = Datetime().getPreviousBillingPeriod();

    var options = {
      one: [{ table: 'restaurants', alias: 'restaurant' }]
    };

    utils.async.parallel([
      db.payment_summaries.find.bind( db.payment_summaries, {
        period_begin: p1.startDate
      , period_end:   p1.endDate
      }, options )

    , db.payment_summaries.find.bind( db.payment_summaries, {
        period_begin: p2.startDate
      , period_end:   p2.endDate
      }, options )
    ], function( error, results ){
      if ( error ){
        req.logger.warn('Error looking up payment summaries', {
          error: error
        });

        return next( error );
      }

      res.locals.payment_summary_groups = results.map( function( pmsList ){
        try {
          return {
            period_begin:       pmsList[0].period_begin
          , period_end:         pmsList[0].period_end
          , payment_summaries:  pmsList
          };
        } catch( e ){
          req.logger.warn('Exception while attempting to parse payment summaries result', {
            exception: e
          });

          console.error( e );

          return null;
        }
      }).filter( function( r ){ return !!r; });

      return next();
    });
  }
, m.view( 'admin/payment-summaries', {
    layout: 'admin/layout2'
  })
);

/*
*  Job Scheduler
*/
route.get('/scheduler'
, m.restrict(['admin'])
, m.view( 'admin/scheduler.hbs', {
    layout: 'admin/layout2'
  })
);
