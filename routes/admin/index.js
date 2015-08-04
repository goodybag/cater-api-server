var express = require('express');

var m = require('../../middleware');
var db = require('../../db');
var controllers = require('../../controllers');
var paletteParser = require('../../lib/parse-palette-from-variables');

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

route.get('/delivery-services'
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

route.get('/users/new', m.param('id'), m.db.regions.find({}, {
  limit: 'all'
}), m.viewPlugin('mainNav', {
  active: 'users'
}), m.view('admin/user/create', {
  layout: 'admin/layout2',
  user: {}
}));

route.get('/users/:id', m.redirect('/admin/users/:id/basic-info'));

route.get('/users/:id/basic-info', m.param('id'), m.viewPlugin('mainNav', {
  active: 'users'
}), m.viewPlugin('sidebarNav', {
  active: 'basic-info',
  baseUrl: '/admin/users/:id'
}), m.viewPlugin('breadCrumbs', {
  currentPage: 'Basic Info'
}), m.queryOptions({
  one: [{
    table: 'regions',
    alias: 'region'
  }],
  userGroups: true
}), m.db.regions.find({}, {
  limit: 'all'
}), m.viewPlugin('mainNav', {
  active: 'users'
}), m.view('admin/user/edit', db.users, {
  layout: 'admin/layout-single-object',
  method: 'findOne'
}));

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
  userGroups: true
}), m.getInvoices({
  userIdParam: 'id'
}), m.db.regions.find({}, {
  limit: 'all'
}), m.viewPlugin('mainNav', {
  active: 'users'
}), m.view('admin/user/invoices', db.users, {
  layout: 'admin/layout-single-object',
  method: 'findOne'
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

route.get('/restaurants/:id/billing-info', m.param('id'), m.viewPlugin('mainNav', {
  active: 'restaurants'
}), m.viewPlugin('sidebarNav', {
  active: 'billing-info',
  baseUrl: '/admin/restaurants/:id'
}), m.states(), m.db.regions.find({}, {
  limit: 'all'
}), m.db.restaurant_plans.find({}, {
  limit: 'all'
}), m.queryOptions({
  many: [{
    table: 'contacts'
  }]
}), m.view('admin/restaurant/edit-billing-info', db.restaurants, {
  layout: 'admin/layout-two-column',
  method: 'findOne'
}));

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

route.get('/ol-greg', m.viewPlugin('mainNav', {
  active: 'home'
}), m.db.restaurants.find({}, {
  limit: 'all',
  one: [{
    table: 'regions',
    alias: 'region'
  }, {
    table: 'restaurant_plans',
    alias: 'plan'
  }],
  order: 'name asc'
}), m.view('admin/ol-greg/home', {
  layout: 'admin/layout2'
}));

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
