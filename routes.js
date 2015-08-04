var express = require('express');
var config = require('./config');
var controllers = require('./controllers');
var utils = require('./utils');
var venter = require('./lib/venter');
var logger = require('./lib/logger');
var Models = require('./models');
var hbHelpers = require('./public/js/lib/hb-helpers');
var db = require('./db');
var errors = require('./errors');

var m = require('./middleware')

module.exports.register = function(app) {
  logger.info('Registering routes');

  app.before( m.analytics, m.queryParams(), function( app ){
    app.get('/', m.getRegions({ where: { is_hidden: false } }), controllers.auth.index);
    app.get('/login', controllers.auth.login);
    app.post('/login', controllers.auth.login);
    app.get('/join', m.getRegions({ where: { is_hidden: false } }), controllers.auth.registerView);
    app.post('/join', m.getRegions({ where: { is_hidden: false } }), controllers.auth.register);

    app.get('/rewards', m.view( 'landing/rewards', {
      layout: 'landing/layout'
    }));

    app.get('/testimonials'
    , m.json({ file: '/public/data/testimonials.json', target: 'testimonials' })
    , m.view( 'landing/testimonials', {
        layout: 'landing/layout'
      })
    );

    app.get('/request-to-be-a-caterer'
    , m.view( 'landing/restaurant', {
        layout: 'landing/layout'
      })
    );

    app.post('/request-to-be-a-caterer'
    , m.after( function( req, res, next ){
        venter.emit( 'restaurant_request:created', req.body );
        next();
      })
    , m.view( 'landing/restaurant', db.restaurant_requests, {
        layout: 'landing/layout'
      , method: 'insert'
      })
    );

    app.get('/forgot-password', controllers.auth.forgotPassword);
    app.post('/forgot-password', controllers.auth.forgotPasswordCreate);
    app.get('/forgot-password/:token', controllers.auth.forgotPasswordConsume);
    app.post('/forgot-password/:token', controllers.auth.forgotPasswordConsume);
  });

  app.use( '/verify', require('./routers/verify') );

  // Temporary for job fair
  app.get('/fsjse.md'
  , m.s3({
      path:   '/fsjse-1.md'
    , key:    config.amazon.awsId
    , secret: config.amazon.awsSecret
    , bucket: config.cdn.bucket
    })
  );

  app.get('/jobs/customer-service-specialist.pdf'
  , m.s3({
      path:   '/customer-service-specialist-1.pdf'
    , key:    config.amazon.awsId
    , secret: config.amazon.awsSecret
    , bucket: config.cdn.bucket
    })
  );

  /**
   * Restaurants resource.  The collection of all restaurants.
   */

  app.get('/restaurants'
  , m.searchTags()
  , m.localCookies(['gb_display'])
  , controllers.restaurants.list
  );

  app.post('/restaurants', m.restrict('admin'), controllers.restaurants.create);

  app.all('/restaurants', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Restaurant resource.  An individual restaurant.
   */

  app.get('/restaurants/manage', m.restrict(['restaurant', 'admin']), controllers.restaurants.listManageable);

  app.get('/restaurants/:rid'
    // Just do a barebones lookup since the controller
    // has to do a legacy db model lookup
  , m.getRestaurant({
      region:       false
    , delivery:     false
    , items:        false
    , amenities:    false
    , photos:       false
    })
  , controllers.restaurants.orders.current
  , m.exists( 'order', {
      then: controllers.orders.auth
    , else: m.noop()
    })
  , m.exists( 'order', {
      then: m.editOrderAuth
    , else: m.noop()
    })
  , controllers.restaurants.get
  );

  app.put('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.update);

  app.patch('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.update);

  app.delete('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.remove);

  app.all('/restaurants/:rid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  app.before( m.restrict('admin'), function( app ){
    app.get('/admin'
    , m.viewPlugin( 'mainNav', { active: 'home' })
    , m.view( 'admin/home', { layout: 'admin/layout2' } )
    );

    app.get('/admin/query-inspector'
    , m.view( 'admin/query-inspector', { layout: 'admin/layout2' } )
    );

    app.get('/admin/upcoming'
    , m.getOrders({
        submittedDate: true
      , upcoming: '3 hours'
      })
    , m.view('admin/upcoming', { layout: 'admin/layout2' })
    );

    app.get('/api/places'
    , require('gplaces').proxy({
        key: config.credentials['google.com'].apiKey
      })
    );

    app.get('/api/upcoming'
    , m.getOrders({
        submittedDate: true
      , upcoming: '3 hours'
      })
    , function(req, res, next) {
        res.send(res.locals.orders);
      }
    );

    /**
     * Regions
     */

    app.get('/admin/regions'
    , m.viewPlugin( 'mainNav', { active: 'regions' })
    , m.sort('+name')
    , m.view( 'admin/regions', db.regions, {
        layout: 'admin/layout2'
      , method: 'find'
      , activeTab: 'regions'
      })
    );

    /**
     * Kitchen Sink
     */

    app.get('/admin/kitchen-sink'
    , m.filters([
        'regions'
      , 'restaurant-visibility'
      , 'restaurant-sort'
      ])
    , function( req, res, next ){
        require('./lib/parse-palette-from-variables').parse( function( error, palette ){
          if ( error ) return next( error );

          res.locals.palette = palette;

          next();
        });
      }

    , function( req, res, next ){
        var not = [ 'white', 'gray-lighter', 'tan' ];

        res.locals.labelTags = res.locals.palette.filter( function( palette ){
          return not.indexOf( palette.name ) === -1;
        }).map( function( palette ){
          return palette.name;
        }).concat([
          'pending', 'submitted', 'delivered', 'canceled', 'accepted', 'denied'
        ]);

        next();
      }

    , m.db.restaurants.find({ is_hidden: false })

    , m.aliasLocals({ ordersTableRestaurants: 'restaurants' })

    , m.view( 'admin/kitchen-sink/index', {
        layout: 'admin/layout2'
      })
    );

    app.get('/admin/kitchen-sink/affix'
    , m.view( 'admin/kitchen-sink/affix', {
        layout: null
      })
    );


    /**
     * Restaurant Plans
     */

   app.get('/admin/restaurant-plans'
    , m.restrict(['admin'])
    , m.sort('+name')
    , m.viewPlugin( 'section', {
        url: '/admin/restaurant-plans'
      })
    , m.viewPlugin( 'collection', { path: 'app/collections/restaurant-plans' } )
    , m.viewPlugin( 'mainNav', { active: 'restaurant-plans' })
    , m.view( 'admin/restaurant-plans/list', db.restaurant_plans, {
        layout: 'admin/layout2'
      , method: 'find'
      })
    );

    app.get('/admin/restaurant-plans/new'
    , m.restrict(['admin'])
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.viewPlugin( 'section', {
        url: '/admin/restaurant-plans'
      })
    , m.viewPlugin( 'mainNav', { active: 'restaurant-plans' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'basic-info'
      , baseUrl:  '/admin/restaurant-plans'
      , isNew:    true
      })
    , m.viewPlugin( 'itemForm', {
        selector:       '#create-item-form'
      , collection:     'app/collections/restaurant-plans'
      , localModelProp: 'restaurant_plan'
      })
    , m.view( 'admin/restaurant-plans/new-item', {
        layout: 'admin/layout-single-object'
      })
    );

    app.get('/admin/restaurant-plans/:id'
    , m.redirect('/admin/restaurant-plans/:id/basic-info')
    );

    app.get('/admin/restaurant-plans/:id/basic-info'
    , m.restrict(['admin'])
    , m.param('id')
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.viewPlugin( 'section', {
        url: '/admin/restaurant-plans'
      })
    , m.viewPlugin( 'mainNav', { active: 'restaurant-plans' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'basic-info'
      , baseUrl:  '/admin/restaurant-plans/:id'
      })
    , m.viewPlugin( 'itemForm', {
        selector:       '#edit-item-form'
      , collection:     'app/collections/restaurant-plans'
      , localModelProp: 'restaurant_plan'
      })
    , m.view( 'admin/restaurant-plans/edit-item', db.restaurant_plans, {
        layout: 'admin/layout-single-object'
      , method: 'findOne'
      })
    );

    /**
     * Delivery Services
     */

    app.get('/admin/delivery-services'
    , m.sort('+name')
    , m.queryOptions({
        one: [{ table: 'regions', alias: 'region' }]
      })
    , m.viewPlugin( 'collection', { path: 'app/collections/delivery-services' } )
    , m.viewPlugin( 'mainNav', { active: 'delivery-services' })
    , m.view( 'admin/delivery-service/list', db.delivery_services, {
        layout: 'admin/layout2'
      , method: 'find'
      })
    );

    app.get('/admin/delivery-services/new'
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.viewPlugin( 'mainNav', { active: 'delivery-services' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'basic-info'
      , baseUrl:  '/admin/delivery-services'
      , isNew:    true
      })
    , m.viewPlugin( 'itemForm', {
        selector:       '#create-item-form'
      , collection:     'app/collections/delivery-services'
      , localModelProp: 'delivery_service'
      })
    , m.view( 'admin/delivery-service/new-item', {
        layout: 'admin/layout-single-object'
      })
    );

    app.get('/admin/delivery-services/:id'
    , m.redirect('/admin/delivery-services/:id/basic-info')
    );

    app.get('/admin/delivery-services/:id/basic-info'
    , m.param('id')
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.queryOptions({ one: [{ table: 'regions', alias: 'region' }] })
    , m.viewPlugin( 'mainNav', { active: 'delivery-services' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'basic-info'
      , baseUrl:  '/admin/delivery-services/:id'
      })
    , m.viewPlugin( 'breadCrumbs', {
        currentPage: 'basic-info'
      })
    , m.viewPlugin( 'itemForm', {
        selector:       '#edit-item-form'
      , collection:     'app/collections/delivery-services'
      , collectionOptions:  { }
      , localModelProp: 'delivery_service'
      })
    , m.view( 'admin/delivery-service/basic-info', db.delivery_services, {
        layout: 'admin/layout-single-object'
      , method: 'findOne'
      })
    );

    app.get('/admin/delivery-services/:id/delivery-zips'
    , m.param('id')
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.queryOptions({ one: [{ table: 'regions', alias: 'region' }] })
    , m.queryOptions({ many: [{ table: 'delivery_service_zips', alias: 'zips' }] })
    , m.viewPlugin( 'mainNav', { active: 'delivery-services' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'delivery-zips'
      , baseUrl:  '/admin/delivery-services/:id'
      })
    , m.viewPlugin( 'breadCrumbs', {
        currentPage: 'delivery-zips'
      })
    , m.view( 'admin/delivery-service/delivery-zips', db.delivery_services, {
        layout: 'admin/layout-single-object'
      , method: 'findOne'
      })
    );

    /**
     * Users list
     */


    app.get('/admin/users'
    , m.sort('-id')
    , m.queryOptions({
        one: [{ table: 'regions', alias: 'region' }]
      })
    , m.viewPlugin( 'mainNav', { active: 'users' })
    , m.view( 'admin/user/list', db.users, {
        layout: 'admin/layout2'
      , method: 'find'
      })
    );

    app.get('/admin/users/new'
    , m.param('id')
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.viewPlugin( 'mainNav', { active: 'users' })
    , m.view( 'admin/user/create', {
        layout: 'admin/layout2'
      , user: {}
      })
    );

    app.get('/admin/users/:id'
    , m.redirect('/admin/users/:id/basic-info')
    );

    app.get('/admin/users/:id/basic-info'
    , m.param('id')
    , m.viewPlugin( 'mainNav', { active: 'users' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'basic-info'
      , baseUrl:  '/admin/users/:id'
      })
    , m.viewPlugin( 'breadCrumbs', {
        currentPage: 'Basic Info'
      })
    , m.queryOptions({
        one: [{ table: 'regions', alias: 'region' }]
      , userGroups: true
      })
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.viewPlugin( 'mainNav', { active: 'users' })
    , m.view( 'admin/user/edit', db.users, {
        layout: 'admin/layout-single-object'
      , method: 'findOne'
      })
    );

    app.get('/admin/users/:id/invoices'
    , m.param('id')
    , m.viewPlugin( 'mainNav', { active: 'users' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'invoices'
      , baseUrl:  '/admin/users/:id'
      })
    , m.viewPlugin( 'breadCrumbs', {
        currentPage: 'Invoices'
      })
    , m.queryOptions({
        one:  [ { table: 'regions', alias: 'region' }]
      , userGroups: true
      })
    , m.getInvoices({ userIdParam: 'id' })
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.viewPlugin( 'mainNav', { active: 'users' })
    , m.view( 'admin/user/invoices', db.users, {
        layout: 'admin/layout-single-object'
      , method: 'findOne'
      })
    );

    /**
     * Invoices standalone
     */

    app.get('/admin/invoices'
    , m.getInvoices()
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.view( 'admin/invoices', db.users, {
        layout: 'admin/layout2'
      , method: 'findOne'
      })
    );

    /**
     * Restaurant list
     */

    app.get('/admin/restaurants'
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.filters([
        'regions'
      , 'restaurant-visibility'
      , 'restaurant-sort'
      ])
    , m.getRestaurants()
    , m.view('admin/restaurant/edit-restaurants', {
        layout: 'admin/layout-page'
      })
    );

    /**
     * Restaurant create
     */

    app.get('/admin/restaurants/create'
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.states()
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.view('admin/restaurant/create', { layout: 'admin/layout-page' })
    );

    app.post('/admin/restaurants/create'
    , controllers.restaurants.create
    );

    /**
     * Restaurant edit resource
     */

    app.get('/admin/restaurants/:id'
    , m.param('id')
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'dashboard'
      , baseUrl:  '/admin/restaurants/:id'
      })
    , m.getRestaurant({ param: 'id', notes: true })
    , m.view('admin/restaurant/edit-dashboard', {
        layout: 'admin/layout-two-column'
      , method: 'findOne'
      })
    );

    app.put('/admin/restaurants/:rid'
    , controllers.restaurants.update
    );

    app.get('/admin/restaurants/:id/dashboard'
    , m.param('id')
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'dashboard'
      , baseUrl:  '/admin/restaurants/:id'
      })
    , m.getRestaurant({ param: 'id', notes: true })
    , m.view('admin/restaurant/edit-dashboard', {
        layout: 'admin/layout-two-column'
      , method: 'findOne'
      })
    );

    app.get('/admin/restaurants/:id/basic-info'
    , m.param('id')
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'basic-info'
      , baseUrl:  '/admin/restaurants/:id'
      })
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.view('admin/restaurant/edit-basic-info', db.restaurants, {
        layout: 'admin/layout-two-column'
      , method: 'findOne'
      })
    );

    app.get('/admin/restaurants/:id/billing-info'
    , m.param('id')
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'billing-info'
      , baseUrl:  '/admin/restaurants/:id'
      })
    , m.states()
    , m.db.regions.find( {}, { limit: 'all' } )
    , m.db.restaurant_plans.find( {}, { limit: 'all' } )
    , m.queryOptions({
        many: [{ table: 'contacts' }]
      })
    , m.view('admin/restaurant/edit-billing-info', db.restaurants, {
        layout: 'admin/layout-two-column'
      , method: 'findOne'
      })
    );

    app.get('/admin/restaurants/:id/transfers'
    , m.param('id')
    , m.getRestaurant({ param: 'id' })
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'transfers'
      , baseUrl:  '/admin/restaurants/:id'
      })
    , m.stripe.getRestaurantTransfers()
    , m.view('admin/restaurant/edit-transfers', db.restaurants, {
        layout: 'admin/layout-two-column'
      , method: 'findOne'
      })
    );

    app.get('/admin/restaurants/:rid/delivery-settings'
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'delivery-settings'
      , baseUrl:  '/admin/restaurants/:rid'
      })
    , m.restaurant( {param: 'rid' } )
    , m.view('admin/restaurant/edit-delivery-settings', {
        layout: 'admin/layout-two-column'
      })
    );

    app.get('/admin/restaurants/:rid/pickup-settings'
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'pickup-settings'
      , baseUrl:  '/admin/restaurants/:rid'
      })
    , m.restaurant( {param: 'rid' } )
    , m.view('admin/restaurant/edit-pickup-settings', {
        layout: 'admin/layout-two-column'
      })
    );


    app.get('/admin/restaurants/:rid/courier-settings'
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
      active:   'courier-settings'
    , baseUrl:  '/admin/restaurants/:rid'
    })
    , m.restaurant( {param: 'rid' } )
    , m.view('admin/restaurant/edit-courier-settings', {
        layout: 'admin/layout-two-column'
      })
    );


    app.get('/admin/restaurants/:rid/tags'
    , m.enums()
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'tags'
      , baseUrl:  '/admin/restaurants/:rid'
      })
    , m.restaurant( {param: 'rid' } )
    , m.view('admin/restaurant/edit-tags', {
        layout: 'admin/layout-two-column'
      })
    );

    app.get('/admin/restaurants/:rid/address'
    , m.states()
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'address'
      , baseUrl:  '/admin/restaurants/:rid'
      })
    , m.restaurant( {param: 'rid' } )
    , m.view('admin/restaurant/edit-address', {
        layout: 'admin/layout-two-column'
      })
    );

    app.get('/admin/restaurants/:restaurant_id/contacts'
    , m.restrict(['admin'])
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'contacts'
      , baseUrl:  '/admin/restaurants/:restaurant_id'
      })
    , m.param('restaurant_id')
    , m.sort('+id')
    , m.restaurant( { param: 'restaurant_id' } )
    , m.view('admin/restaurant/edit-contacts', db.contacts, {
        layout: 'admin/layout-two-column'
      , method: 'find'
      })
    );

    app.get('/admin/restaurants/:rid/menu'
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'menu'
      , baseUrl:  '/admin/restaurants/:rid'
      })
    , m.restaurant( { param: 'rid', withMenuItems: true } )
    , m.view('admin/restaurant/edit-menu', {
        layout: 'admin/layout-two-column'
      })
    );

    app.get('/admin/restaurants/:id/amenities'
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'amenities'
      , baseUrl:  '/admin/restaurants/:id'
      })
    , m.param('id')
    , m.queryOptions({
        many: [ { table: 'amenities' } ]
      })
    , m.view('admin/restaurant/edit-amenities', db.restaurants, {
        layout: 'admin/layout-two-column'
      , method: 'findOne'
      })
    );

    app.get('/admin/restaurants/:restaurant_id/photos'
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'photos'
      , baseUrl:  '/admin/restaurants/:restaurant_id'
      })
    , m.restaurant( { param: 'restaurant_id' } )
    , m.param('restaurant_id')
    , m.sort('+priority')
    , m.view('admin/restaurant/edit-photos', db.restaurant_photos, {
        layout: 'admin/layout-two-column'
      , method: 'find'
      })
    );

    app.get('/admin/restaurants/:id/widgets'
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

    app.get('/admin/restaurants/:rid/sort', controllers.restaurants.sort);

    /**
     * Restaurant copy
     */

    app.get('/admin/restaurants/:restaurant_id/copy'
    , controllers.restaurants.copy
    );

    app.get('/admin/restaurants/:id/locations'
    , m.param('id')
    , m.queryOptions({
        one:    [{ table: 'regions', alias: 'region' }]
      , many:   [ { table: 'restaurant_locations', alias: 'locations'
                  , order: [ 'is_default desc', 'name asc' ]
                  }
                ]
      })
    , m.viewPlugin( 'sidebarNav', {
        active:   'locations'
      , baseUrl:  '/admin/restaurants/:id'
      })
    , m.viewPlugin( 'collection', { path: 'app/collections/restaurant-locations' } )
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.view( 'admin/restaurant/locations-list', db.restaurants, {
        layout: 'admin/layout-single-object'
      , method: 'findOne'
      })
    );

    app.get('/admin/restaurants/:id/locations/new'
    , m.param('id')
    , m.queryOptions({
        one:  [{ table: 'regions', alias: 'region' }]
      })
    , m.states()
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'locations'
      , baseUrl:  '/admin/restaurants/:id'
      })
    , m.viewPlugin( 'itemForm', {
        selector:           '#create-item-form'
      , collection:         'app/collections/restaurant-locations'
      , collectionOptions:  { restaurant_id: ':id' }
      })
    , m.view( 'admin/restaurant/location-new', db.restaurants, {
        layout: 'admin/layout-single-object'
      , method: 'findOne'
      })
    );

    app.get('/admin/restaurants/:restaurant_id/locations/:id'
    , m.param('restaurant_id')
    , m.param('id')
    , m.states()
    , m.queryOptions({ one: [{ table: 'regions', alias: 'region' }] })
    , m.viewPlugin( 'mainNav', { active: 'restaurants' })
    , m.viewPlugin( 'sidebarNav', {
        active:   'locations'
      , baseUrl:  '/admin/restaurants/:restaurant_id'
      })
    , m.viewPlugin( 'breadCrumbs', {
        currentPage: 'New Invoice'
      })
    , m.viewPlugin( 'itemForm', {
        selector:           '#edit-item-form'
      , collection:         'app/collections/restaurant-locations'
      , localModelProp:     'restaurant_location'
      , collectionOptions:  { restaurant_id: ':restaurant_id' }
      })
    , function( req, res, next ){
        return m.db.restaurants.findOne( req.params.restaurant_id )( req, res, next );
      }
    , m.view( 'admin/restaurant/location-edit', db.restaurant_locations, {
        layout: 'admin/layout-single-object'
      , method: 'findOne'
      })
    );

    app.get('/admin/ol-greg'
    , m.viewPlugin( 'mainNav', { active: 'home' })
    , m.db.restaurants.find( {}, {
        limit:  'all'
      , one:    [ { table: 'regions', alias: 'region' }
                , { table: 'restaurant_plans', alias: 'plan' }
                ]
      , order:  'name asc'
      })
    , m.view( 'admin/ol-greg/home', {
        layout: 'admin/layout2'
      })
    );
  });


  /**
   * Restaurant items resource.  The collection of all items belonging to a restaurant.
   */

  app.get('/restaurants/:rid/items', m.restrict(['client', 'admin']), controllers.restaurants.listItems);  // not currently used

  app.all('/restaurants/:rid/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   * Restaurant events resource.
   */

  app.get('/restaurants/:rid/events', m.restrict(['admin']), controllers.restaurants.events.list);

  app.post('/restaurants/:rid/events', m.restrict(['admin']), controllers.restaurants.events.create);

  app.all('/restaurants/:rid/events', m.restrict(['admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Individual restaurant event resource.
   */

  app.put('/restaurants/:rid/events/:eid', m.restrict(['admin']), controllers.restaurants.events.update);

  app.patch('/restaurants/:rid/events/:eid', m.restrict(['admin']), controllers.restaurants.events.update);

  app.delete('/restaurants/:rid/events/:eid', m.restrict(['admin']), controllers.restaurants.events.remove);

  app.all('/restaurants/:rid/events/:eid', m.restrict(['admin']), function(req, res, next) {
    res.set('Allow', 'PUT', 'PATCH, DELETE');
    res.send(405);
  });

  /**
   * CSV Menu
   */
  app.get('/admin/restaurants/:rid/menu.csv', m.restrict(['client', 'admin']), controllers.restaurants.menuCsv);

  /**
   * Restaurant categories resource.  The collection of all categories belonging to a restaurant.
   */

  app.get('/restaurants/:rid/categories', m.restrict(['client', 'admin']), controllers.restaurants.categories.list);  // not currently used

  app.post('/restaurants/:rid/categories', m.restrict('admin'), controllers.restaurants.categories.create);

  app.all('/restaurants/:rid/categories', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Individual category resource.  A single restaurant category.
   */

  app.get('/restaurants/:rid/categories/:cid', m.restrict(['client', 'admin']), controllers.restaurants.categories.get);  // not currently used

  app.put('/restaurants/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.update);

  app.patch('/restaurants/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.update);

  app.delete('/restaurants/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.remove);

  app.all('/restaurants/:rid/categories/:cid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  /**
   *  Category items resource.  The collection of all items belonging to a single category.
   */

  app.get('/restaurants/:rid/categories/:cid/items', m.restrict(['client', 'admin']), controllers.restaurants.categories.listItems);  // not currently used

  app.post('/restaurants/:rid/categories/:cid/items', m.restrict('admin'), controllers.restaurants.categories.addItem);

  app.all('/restaurants/:rid/categories/:cid/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Restaurant orders resource.  The collection of all orders belonging to a single restaurant.
   */

  app.post('/restaurants/:rid/orders', m.restrict(['client', 'admin']), function(req, res, next) {
    req.body.restaurant_id = req.params.rid;
    req.url = '/orders';
    next();
  });

  app.all('/restaurants/:rid/orders', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Current order resource.  The current pending order for the given restaurant and logged in user.
   */

  app.all('/restaurants/:rid/orders/current(/*)?', m.restrict(['client', 'admin']), controllers.restaurants.orders.current);

  /**
   *  Items resource.  The collection of all items.
   */

  app.get('/items', m.restrict(['client', 'admin']), controllers.items.list);  // not currently used

  app.all('/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Item resource.  An individual item.
   */

  app.get('/items/:id', m.restrict(['client', 'admin']), controllers.items.get);  // not currently used

  app.put('/items/:id', m.restrict('admin'), controllers.items.update);

  app.patch('/items/:id', m.restrict('admin'), controllers.items.update);

  app.delete('/items/:id', m.restrict('admin'), controllers.items.remove);

  app.all('/items/:id', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH,  DELETE');
    res.send(405);
  });

  /**
   *  Orders resource.  The collection of all orders.
   */

  app.get('/orders'
  , m.restrict('admin')
  , m.pagination({ pageParam: 'p' })
  , m.param('status')
  , m.param('type')
    // Cas IDs to ints so indexOf checks work
  , function( req, res, next ){
      if ( !Array.isArray( req.query['restaurants.region_id'] ) ) return next();

      req.query['restaurants.region_id'] = req.query['restaurants.region_id'].map( function( id ){
        return parseInt( id );
      });

      // Setup the url->sql where clause
      return m.param('restaurants.region_id')( req, res, next );
    }
  , m.sort('-id')
  , m.queryOptions({
      submittedDate: true
    , one: [
        { table: 'users',       alias: 'user' }
      , { table: 'restaurants', alias: 'restaurant' }
      , { table: 'delivery_services', alias: 'delivery_service'}
      ]
    , joins: [
        { type: 'left', target: 'restaurants', on: { id: '$orders.restaurant_id$' } }
      ]
    })
  , function( req, res, next ){
      res.locals.status = req.params.status;
      if ( req.params.status == 'accepted' ){
        req.queryOptions.statusDateSort = { status: req.params.status };
      }
      return next();
    }
  , m.view('orders', db.orders)
  );

  app.post('/orders', m.restrict(['guest', 'client', 'admin']), controllers.orders.create);

  app.all('/orders', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Order voice resource.  TwiML for phone notifications of order submitted.
   */

  app.get('/orders/:oid/voice', controllers.orders.voice);

  app.all('/orders/:oid/voice', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });


  /**
   *  Order resource.  An individual order.
   */

  app.get('/orders/:oid/manifest'
  , m.basicAuth()
  , m.restrict(['admin', 'receipts'])
  , m.getOrder2({
      items:      true
    , manifest:   true
    , user:       true
    , restaurant: true
    , amenities:  true
    })
  , m.view( 'order-manifest/manifest-1', {
      layout: 'order-manifest/layout'
    })
  );

  app.get('/manifests/manifest-:oid.pdf'
  // For now, don't restrict so I don't have to re-write the ?review_token mess
  // , m.restrict(['admin', 'restaurant'])
  , m.s3({
      path:   '/manifest-:oid.pdf'
    , key:    config.amazon.awsId
    , secret: config.amazon.awsSecret
    , bucket: config.receipt.bucket
    })
  );

  // app.all(/^\/orders\/(\d+)(?:\/.*)?$/
  // , function (req, res, next) {
  //     req.params.id = req.params[0];
  //     next();
  //   }
  // , m.getOrder2({ param: 'id' })
  // , controllers.orders.auth
  // );

  app.get('/orders/:oid'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    , submittedDate:      true
    , amenities:          true
    , orderFeedback:      true
    })
  , controllers.orders.auth
  , m.restrict(['admin', 'receipts', 'order-owner', 'order-restaurant'])
  , controllers.orders.get
  );

  app.put('/orders/:oid'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'order-restaurant', 'admin'])
  , m.audit.orderType()
  , controllers.orders.update
  );

  app.patch('/orders/:oid'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'order-restaurant', 'admin'])
  , controllers.orders.editability
  , controllers.orders.update
  );

  app.delete('/orders/:oid'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'order-restaurant', 'admin'])
  , function(req, res, next) {
      req.body = {status: 'canceled'};
      next();
    }
  , controllers.orders.changeStatus
  );

  app.all('/orders/:oid', m.restrict(['client', 'restaurant', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST, PUT, PATCH, DELETE');
    res.send(405);
  });

  app.get(
    config.receipt.orderRoute
  , m.basicAuth()
  , m.restrict(['admin', 'receipts'])
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    , paymentMethod:      true
    , amenities:          true
    })
  , function(req, res, next){ req.params.receipt = true; next(); }
  , controllers.orders.get
  );

  app.get('/receipts/order-:oid.pdf', m.s3({
    path:   '/' + config.receipt.fileName
  , key:    config.amazon.awsId
  , secret: config.amazon.awsSecret
  , bucket: config.receipt.bucket
  }));

  /**
   *  Order status resource.  The collection of all statuses on a single order.
   */

  app.get('/orders/:oid/status-history'
  , m.restrict(['client', 'admin'])
  , controllers.orders.listStatus
  );

  // people with restaurant review token can access this route.  leave auth to controllers.orders.auth.
  app.post('/orders/:oid/status-history'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.restrict(['admin', 'order-owner', 'order-restaurant'])
  , controllers.orders.changeStatus
  );

  app.all('/orders/:oid/status-history', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Delivery service actions
   */
  app.get('/orders/:oid/delivery-service-accept'
  , m.deliveryServiceAuth()
  , controllers.orders.deliveryServices.accept
  );

  /**
   *  Order items resource.  The collection of all order items on a single order.
   *  This is a collection of OrderItems, not Items.
   */

  //app.get('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.orderItems.list);  // not currently used
  app.get('/orders/:oid/items'
  , m.getOrder2({
      param:                    'oid'
    , items:                    true
    , user:                     true
    , userAddresses:            true
    , userPaymentMethods:       true
    , restaurant:               true
    , amenities:                true
    , deliveryService:          true
    , restaurantDbModelFind:    true
    })
  , controllers.orders.auth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.orders.orderItems.summary
  );

  app.post('/orders/:oid/items'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.editOrderAuth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.orders.editability
  , controllers.orders.orderItems.add
  );

  app.all('/orders/:oid/items', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order item resource.  A single order item.
   */

  app.get('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.get);  // not currently used

  app.put('/orders/:oid/items/:iid'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.editOrderAuth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.orders.editability
  , controllers.orders.orderItems.update
  );

  app.patch('/orders/:oid/items/:iid'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.editOrderAuth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.orders.editability
  , controllers.orders.orderItems.update
  );

  app.delete(
    '/orders/:oid/items/:iid'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.editOrderAuth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.orders.editability
  , controllers.orders.orderItems.remove
  );

  app.all('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  /**
   * Order Duplicates resource.  Duplicates of an order.
   */

  app.post('/orders/:oid/duplicates', m.restrict(['client', 'admin']), controllers.orders.duplicate);

  app.all('/orders/:oid/duplicates', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'POST');
    res.send(405);
  });

  /**
   * Order add items resource.  Page to add items to an order.  (basically the menu page)
   */

  app.get('/orders/:oid/add-items'
  , m.getOrder2({
      param:                  'oid'
    , items:                  true
    , user:                   true
    , userAddresses:          true
    , userPaymentMethods:     true
    , restaurant:             true
    , deliveryService:        true
    , restaurantDbModelFind:  true
    })
  , controllers.orders.auth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.restaurants.orders.get
  );


  app.get('/orders/:oid/notifications/:nid'
  , m.restrict(['admin'])
  , controllers.orders.notifications.getEmail
  );

  app.get('/orders/:oid/payment'
  , m.getOrder2({
      param:                  'oid'
    , items:                  true
    , user:                   true
    , userAddresses:          true
    , userPaymentMethods:     true
    , restaurant:             true
    , deliveryService:        true
    , restaurantDbModelFind:  true
    })
  , controllers.orders.auth
  , m.restrict(['admin', 'order-owner'])
  , m.view( 'order-payment',{

   })
  );

  /**
   * Reporting resource
   */

  app.get('/reports'
  , m.restrict(['admin'])
  , m.getRegions()
  , controllers.reports.index
  );

  app.get('/reports/orders'
  , m.restrict(['admin'])
  , m.csv()
  , controllers.reports.ordersCsv
  );

  app.get('/reports/users'
  , m.restrict(['admin'])
  , m.csv()
  , controllers.reports.usersCsv
  );

  app.get('/reports/redemptions'
  , m.restrict(['admin'])
  , m.csv()
  , controllers.reports.usersRedemptionsCsv
  );

  /**
   *  Auth page resource.  Simple static login/register page.
   *  Also includes /logout route as a convienence so people can logout by loading a url.
   */

  app.get('/auth', controllers.auth.index);

  app.post('/auth', controllers.session.create);

  app.post('/auth/signup', controllers.auth.signup);

  app.all('/auth', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  app.all('/auth/logout', controllers.session.del);

  /**
   *  Session resource.  Create and delete session to log in / out.
   */

  app.get('/session', controllers.session.get);

  app.post('/session', controllers.session.create);

  app.delete('/session', controllers.session.del)

  app.all('/session', function(req, res, next) {
    res.set('Allow', 'GET, POST, DELETE');
    res.send(405);
  });


  // For the order params
  app.get('/session/order-params', controllers.session.getOrderParams);

  app.put('/session/order-params', controllers.session.updateOrderParams);

  /**
   *  Users resource.  All the users.
   */

  app.get('/users'
  , m.restrict('admin')
  , m.db.restaurants.find( {}, { limit: 'all' })
  , m.queryOptions({
      limit: 'all'
    , order: 'id desc'
    , one:  [ { table: 'regions', alias: 'region' } ]
    })
  , m.view( 'users', db.users, { method: 'find' })
  );

  app.post('/users', m.restrict('admin'), controllers.admin.users.create, controllers.admin.users.handleError);

  app.all('/users', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * User return resource. Restore admin session after impersonating another user.
   * Placed higher in the stack so 'client' users can access this route
   */

  app.get('/users/return', controllers.users.returnSession);

  app.all('/users/return', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Current user resource.
   */

   app.all (/^\/users\/me(?:\/.*)?$/, function(req, res, next) {
    if (!req.user) return m.owner()(req, res, next);
    req.url = req.url.replace(/^\/users\/me/, '/users/' + req.user.attributes.id);
    next();
  });

  app.before( m.owner(), function( app ){
    app.get('/users/:uid', controllers.users.get);

    var restrictUpdate = m.filterBody({
      client: Models.User.ownerWritable
    });

    app.put('/users/:uid'
    , restrictUpdate
    , m.updateStripeCustomer({ required: 'user', pick: ['name'] })
    , controllers.users.update
    );

    app.patch('/users/:uid'
    , restrictUpdate
    , m.updateStripeCustomer({ required: 'user', pick: ['name'] })
    , controllers.users.update);

    app.delete('/users/:uid', function(req, res) { res.send(501); });

    app.all('/users/:uid', function(req, res, next) {
      res.set('Allow', 'GET, PUT, DELETE');
      res.send(405);
    });

    /**
     *  User Orders resource.  All the orders placed by an individual user.
     */

    app.get('/users/:uid/orders'
    // , m.pagination({ pageParam: 'p' }) // todo: paging set up for users orders
    , m.param('uid', function(user_id, $query, options) {
        $query.where = $query.where || {};
        $query.where.user_id = user_id;
      })
    , m.param('status')
    , m.param('type')
    , m.sort('-id')
    , m.queryOptions({
        one:  [ { table: 'restaurants', alias: 'restaurant' }
              , { table: 'users', alias: 'user' }
              ]
      , submittedDate: true
      })
    , function( req, res, next ){
        res.locals.status = req.params.status;
        if ( req.params.status == 'accepted' ){
          req.queryOptions.statusDateSort = { status: req.params.status };
        }
        return next();
      }
    , m.view( 'user-orders', db.orders )
    );

    app.get('/users/:uid/orders/receipts'
    , m.param('uid', function(user_id, $query, options) {
        $query.where = $query.where || {};
        $query.where.user_id = user_id;
      })
    , m.param('status', 'accepted')
    , m.sort('-datetime')
    , m.queryOptions({
        one:  [ { table: 'restaurants', alias: 'restaurant' }
              , { table: 'users', alias: 'user' }
              ]
      })
    , m.view('user-receipts', db.orders, {
        layout: 'layout/default'
      })
    );

    app.all('/users/:uid', function(req, res, next) {
      res.set('Allow', 'GET');
      res.send(405);
    });

    /**
     * Loyalty
     */

    app.get('/users/:uid/rewards'
    , controllers.users.rewards.list
    );

    /**
     *  User Addresseses resource.
     */

    app.get('/users/:uid/addresses', controllers.users.addresses.list);

    app.post('/users/:uid/addresses', controllers.users.addresses.create);

    app.all('/users/:uid/addresses', function(req, res, next) {
      res.set('Allow', 'GET', 'POST');
      res.send(405);
    });

    /**
     * User Address resource. Represents a single address per user
     */

    app.get('/users/:uid/addresses/:aid', controllers.users.addresses.get);

    app.put('/users/:uid/addresses/:aid', controllers.users.addresses.update);

    app.patch('/users/:uid/addresses/:aid', controllers.users.addresses.update);

    app.delete('/users/:uid/addresses/:aid', controllers.users.addresses.remove);

    app.all('/users/:uid/addresses/:aid', function(req, res, next) {
      res.set('Allow', 'GET', 'PUT', 'PATCH', 'DELETE');
      res.send(405);
    });

    /**
     * User cards resource
     */

    app.get('/users/:uid/cards', controllers.users.cards.list);

    app.post('/users/:uid/cards', controllers.users.cards.create);

    app.get('/users/:uid/cards/:cid', controllers.users.cards.get);

    app.put('/users/:uid/cards/:cid', controllers.users.cards.update);

    app.patch('/users/:uid/cards/:cid', controllers.users.cards.update);

    app.delete('/users/:uid/cards/:cid', controllers.users.cards.remove);

    app.all('/users/:uid/cards/:cid', function(req, res, next) {
      res.set('Allow', 'GET', 'PUT', 'PATCH', 'DELETE');
      res.send(405);
    });

    /**
     *  User session resource.  Represents a session as a specific user.
     */

    app.get('/users/:uid/session', controllers.users.createSessionAs);

    app.post('/users/:uid/session', controllers.users.createSessionAs);

    app.all('/users/:uid/session', function(req, res, next) {
      res.set('Allow', 'GET', 'POST');
      res.send(405);
    });
  });

  /**
   *  Password reset resource
   */

  app.post('/password-resets', controllers.users.passwordResets.create);

  app.get('/password-resets/:token', controllers.users.passwordResets.get);

  app.put('/password-resets/:token', controllers.users.passwordResets.redeem);

  /**
   *  Waitlist resource
   */

  app.post('/waitlist', controllers.waitlist.add);

  // needs to be get for one click links in email.
  app.get('/waitlist/unsubscribe', controllers.waitlist.remove);

  app.get('/waitlist/confirm', controllers.waitlist.confirm);

  /**
   *  Static pages
   */

  app.get('/signup', m.restrict('admin'), controllers.statics.createUser);

  app.get('/contact-us', controllers.statics.contactUs);

  app.post('/contact-us', controllers.contactUs.sendSupportEmail);

  app.get('/faqs'
  , m.json({ file: '/public/data/faqs.json', target: 'faqs' })
  , m.view('faqs')
  );

  app.get('/legal', controllers.statics.legal);

  app.get('/privacy', controllers.statics.privacy);

  app.get('/analytics'
  , m.restrict(['admin'])
  , controllers.analytics.list
  );

  // For testing emails and shtuff
  app.get('/emails/:name'
  , m.restrict(['admin'])
  , controllers.emails.get
  );

  app.post('/emails/:name'
  , m.restrict(['admin'])
  , controllers.emails.post
  );

  app.get('/docs/style', m.restrict('admin'), controllers.statics.styleGuide);

  app.get( config.invoice.pdfRoute
  , m.basicAuth()
  , m.restrict(['admin', 'receipts'])
  , m.s3({
      path:   '/' + config.invoice.fileFormat
    , key:    config.amazon.awsId
    , secret: config.amazon.awsSecret
    , bucket: config.invoice.bucket
    })
  );

  app.get(
    config.invoice.htmlRoute
  , m.basicAuth()
  , m.restrict(['admin', 'receipts'])
  , function( req, res, next ){
      var invoice = require('stamps/user-invoice').create({
        id: req.params.id
      }).fetch( function( error ){
        if ( error ) return next( error );

        // So HBS doesn't screw EVERYTHING up
        res.locals.invoice = invoice.toJSON();

        return next();
      });
    }
  , m.view( 'invoice/invoice', {
      layout: 'invoice/invoice-layout'
    })
  );

  app.get('/admin/restaurants/:restaurant_id/orders'
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


  app.get('/admin/restaurants/:id/payment-summaries'
  , m.restrict(['admin'])
  , m.param('id')
  , m.queryOptions({
      many: [{ table: 'contacts' }]
    })
  , m.view( 'admin/restaurant-payment-summaries', db.restaurants, {
      layout: 'admin/layout'
    , method: 'findOne'
    })
  );

  app.get('/admin/restaurants/:id/payment-summaries/:payment_summary_id'
  , m.restrict(['admin'])
  , m.param('id')
  , function( req, res, next ){
      res.locals.payment_summary_id = req.params.payment_summary_id;
      return next();
    }
  , m.queryOptions({
      one:  [{ table: 'restaurant_plans', alias: 'plan' }]
    })
  , m.view( 'admin/restaurant-payment-summary', db.restaurants, {
      layout: 'admin/layout'
    , method: 'findOne'
    })
  );

  app.get('/admin/restaurants/:restaurant_id/contacts'
  , m.restrict(['admin'])
  , m.param('restaurant_id')
  , m.restaurant( {param: 'restaurant_id'} )
  , m.view( 'restaurant/contacts', db.contacts, {
     layout: 'admin/layout2'
   , method: 'find'
   })
  );

  app.get('/admin/orders/:id'
  , m.restrict(['admin'])
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
    })
  , m.view( 'admin/order', {
      layout: 'admin/layout2'
    })
  );


  app.get('/admin/analytics'
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

  app.get('/admin/analytics/demand'
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

  app.get('/admin/analytics/retention'
  , m.restrict(['admin'])
  , m.filters([ 'regions' ])
  , m.organizationSubmissions()
  , m.orderAnalytics.retention()
  , m.view( 'admin/analytics/retention', {
      layout: 'admin/layout2'
    })
  );

  app.get('/payment-summaries/ps-:psid.pdf'
  , m.restrict(['admin'])
  , m.s3({
      path:   '/payment-summary-:psid.pdf'
    , key:    config.amazon.awsId
    , secret: config.amazon.awsSecret
    , bucket: config.paymentSummaries.bucket
    })
  );

  app.get( config.paymentSummaries.route
  , m.basicAuth()
  , m.restrict(['admin', 'pms'])
  , m.param('id')
  , m.param('restaurant_id')
  , m.restaurant({ param: 'restaurant_id' })
  , m.queryOptions({
      many: [ { table:  'payment_summary_items'
              , alias:  'items'
              , one:    [ { table: 'orders'
                          , alias: 'order'
                          , one:  [ { table: 'delivery_services'
                                    , alias: 'delivery_service'
                                    }
                                  , { table: 'restaurants'
                                    , alias: 'restaurant'
                                    }
                                  , { table: 'users'
                                    , alias: 'user'
                                    }
                                  ]
                          }
                        ]
              }
            ]
    , one:  [ { table: 'restaurants', alias: 'restaurant'
              , one: [{ table: 'restaurant_plans', alias: 'plan' }, { table: 'regions', alias: 'region' }]
              }
            ]
    })
  , m.view( 'invoice/payment-summary', db.payment_summaries, {
      layout: 'invoice/invoice-layout'
    , method: 'findOne'
    })
  );

  app.get('/api/restaurants'
  , m.restrict(['admin'])
  , m.sort('-id')
  , m.param('region_id')
  , m.queryOptions({
      many: []
    , one:  [{ table: 'regions', alias: 'region' }]
    })
  , m.find( db.restaurants )
  );

  app.post('/api/restaurants'
  , m.restrict(['admin'])
  , m.insert( db.restaurants )
  );

  app.get('/api/restaurants/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.findOne( db.restaurants )
  );

  app.put('/api/restaurants/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.update( db.restaurants )
  );

  app.patch('/api/restaurants/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.getRestaurant({ param: 'id' })
  , m.updateStripeCustomer({ required: 'restaurant', pick: ['name'] })
  , m.update( db.restaurants )
  );

  app.delete('/api/restaurants/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.restaurants )
  );

  app.post('/api/restaurants/:id/auto-update'
  , m.restrict(['admin'])
  , m.getRestaurant({
      param: 'id'
    , delivery: true
    })
  , controllers.api.restaurants.autoPopulate
  );

  app.get('/api/restaurants/:restaurant_id/orders'
  , m.restrict(['admin'])
  , m.pagination({ allowLimit: true })
  , m.param('restaurant_id')
  , m.param('status')
  , m.param( 'start_date', function( value, $where, options ){
      $where.datetimeRange = $where.datetimeRange || { datetime: {} };
      $where.datetimeRange.datetime.$gte = value;
    })
  , m.param( 'end_date', function( value, $where, options ){
      $where.datetimeRange = $where.datetimeRange || { datetime: {} };
      $where.datetimeRange.datetime.$lt = value;
    })
  , m.queryOptions({
      one:  [{ table: 'restaurants', alias: 'restaurant' }]
    , many: [{ table: 'order_items', alias: 'items' }]
    })
  , m.find( db.orders )
  );

  app.get('/api/restaurants/:restaurant_id/contacts'
  , m.restrict( ['admin'] )
  , m.param('restaurant_id')
  , m.find( db.contacts )
  );

  app.post('/api/restaurants/:restaurant_id/contacts'
  , m.restrict( ['admin'] )
  , m.queryToBody('restaurant_id')
  , m.insert( db.contacts )
  );

  app.put('/api/restaurants/:restaurant_id/contacts/:id'
  , m.restrict( ['admin'] )
  , m.param('restaurant_id')
  , m.param('id')
  , m.update( db.contacts )
  );

  app.delete('/api/restaurants/:restaurant_id/contacts/:id'
  , m.restrict( ['admin'] )
  , m.param('restaurant_id')
  , m.param('id')
  , m.remove( db.contacts )
  );

  app.get('/api/restaurants/:restaurant_id/locations'
  , m.pagination({ allowLimit: true })
  , m.param('restaurant_id')
  , m.find( db.restaurant_locations )
  );

  app.post('/api/restaurants/:restaurant_id/locations'
  , m.queryToBody('restaurant_id')
  , m.geocodeBody()
  , m.insert( db.restaurant_locations )
  );

  app.get('/api/restaurants/:restaurant_id/locations/:id'
  , m.param('id')
  , m.param('restaurant_id')
  , m.findOne( db.restaurant_locations )
  );

  app.put('/api/restaurants/:restaurant_id/locations/:id'
  , m.param('id')
  , m.param('restaurant_id')
  , function( req, res, next ){
      m.db.restaurant_locations.findOne( req.params.id )( req, res, next );
    }
  , m.geocodeBody({ defaultsWith: 'restuarant_location' })
  , m.update( db.restaurant_locations )
  );

  app.delete('/api/restaurants/:restaurant_id/locations/:id'
  , m.param('id')
  , m.param('restaurant_id')
  , m.remove( db.restaurant_locations )
  );

  app.get('/api/restaurants/:restaurant_id/payment-summaries'
  , m.pagination({ allowLimit: true })
  , m.param('restaurant_id')
  , m.find( db.payment_summaries )
  );

  app.post('/api/restaurants/:restaurant_id/payment-summaries'
    // Ensure restaurant ID in the URL is what is in the body
  , m.queryToBody('restaurant_id')
  , function( req, res, next ){
      m.db.payment_summaries.insert( req.body )( req, res, next );
    }
  , m.after( function( req, res, next ){
      venter.emit(
        'payment-summary:change'
      , res.locals.payment_summary.id
      , req.params.restaurant_id
      );

      next();
    })
  , m.jsonLocals('payment_summary')
  );

  app.get('/api/restaurants/:restaurant_id/payment-summaries/:id'
  , m.param('id')
  , m.param('restaurant_id')
  , m.findOne( db.payment_summaries )
  );

  app.put('/api/restaurants/:restaurant_id/payment-summaries/:id'
  , m.param('id')
  , m.param('restaurant_id')
  , m.after( controllers.paymentSummaries.emitPaymentSummaryChange() )
  , m.update( db.payment_summaries )
  );

  app.delete('/api/restaurants/:restaurant_id/payment-summaries/:id'
  , m.param('id')
  , m.param('restaurant_id')
  , m.remove( db.payment_summaries )
  );

  app.post('/api/restaurants/:restaurant_id/transfers'
  , m.restrict(['accounting', 'admin'])
  , m.getRestaurant({ param: 'restaurant_id' })
  , m.stripe.createRestaurantTransfer()
  );

  app.post('/api/restaurants/:restaurant_id/payment-summaries/:payment_summary_id/send'
  , controllers.paymentSummaries.send
  );

  app.get('/api/restaurants/:restaurant_id/payment-summaries/:payment_summary_id/items'
  , m.pagination()
  , controllers.paymentSummaries.applyRestaurantId()
  , m.param('payment_summary_id')
  , m.queryOptions({
      one:  [ { table: 'orders'
              , alias: 'order'
              , one:  [ { table: 'delivery_services'
                        , alias: 'delivery_service'
                        }
                      , { table: 'restaurants'
                        , alias: 'restaurant'
                        }
                      ]
              }
            ]
    })
  , m.find( db.payment_summary_items )
  );

  app.post('/api/restaurants/:restaurant_id/payment-summaries/:payment_summary_id/items'
  , m.queryToBody('payment_summary_id')
  , m.after( controllers.paymentSummaries.emitPaymentSummaryChange() )
  , m.insert( db.payment_summary_items )
  );

  app.get('/api/restaurants/:restaurant_id/payment-summaries/:payment_summary_id/items/:id'
  , controllers.paymentSummaries.applyRestaurantId()
  , m.param('payment_summary_id')
  , m.param('id')
  , m.findOne( db.payment_summary_items )
  );

  app.put('/api/restaurants/:restaurant_id/payment-summaries/:payment_summary_id/items/:id'
  , controllers.paymentSummaries.applyRestaurantIdForNonJoins()
  , m.param('payment_summary_id')
  , m.param('id')
  , m.after(
      controllers.paymentSummaries.emitPaymentSummaryChange({ idField: 'payment_summary_id' })
    )
  , m.update( db.payment_summary_items )
  );

  app.delete('/api/restaurants/:restaurant_id/payment-summaries/:payment_summary_id/items/:id'
  , controllers.paymentSummaries.applyRestaurantIdForNonJoins()
  , m.param('payment_summary_id')
  , m.param('id')
  , m.after(
      controllers.paymentSummaries.emitPaymentSummaryChange({ idField: 'payment_summary_id' })
    )
  , m.remove( db.payment_summary_items )
  );

  app.get('/api/restaurants/:restaurant_id/photos'
  , m.restrict( ['client', 'admin'] )
  , m.param('restaurant_id')
  , m.find( db.restaurant_photos )
  );

  app.post('/api/restaurants/:restaurant_id/photos'
  , m.restrict( 'admin' )
  , m.queryToBody('restaurant_id')
  , m.sort('+priority')
  , m.insert( db.restaurant_photos )
  );

  app.get('/api/restaurants/:restaurant_id/photos/:id'
  , m.restrict( ['client', 'admin'] )
  , m.param('restaurant_id')
  , m.param('id')
  , m.findOne( db.restaurant_photos )
  );

  app.put('/api/restaurants/:restaurant_id/photos/:id'
  , m.restrict( ['admin'] )
  , m.param('restaurant_id')
  , m.param('id')
  , m.update( db.restaurant_photos )
  );

  app.delete('/api/restaurants/:restaurant_id/photos/:id'
  , m.restrict( ['admin'] )
  , m.param('restaurant_id')
  , m.param('id')
  , m.remove( db.restaurant_photos )
  );

  app.post('/api/restaurants/:restaurant_id/notes'
  , m.restrict( ['admin'] )
  , m.insert( db.restaurant_notes )
  );

  app.get('/api/orders'
  , m.restrict(['admin'])
  , m.pagination()
  , m.param('status')
  , function( req, res, next ){
      res.locals.status = req.params.status;
      if ( req.params.status == 'accepted' ){
        req.queryOptions.statusDateSort = { status: req.params.status };
      }
      return next();
    }
  , m.sort('-id')
  , m.queryOptions({
      one: [
        { table: 'users',       alias: 'user' }
      , { table: 'restaurants', alias: 'restaurant' }
      ]
    })
  , m.find( db.orders )
  );

  app.post('/api/orders'
  , m.restrict(['admin'])
  , m.insert( db.orders )
  );

  app.get('/api/orders/search'
  , function(req, res, next) {
      var query = req.query.q;
      if ( !query ) return next();
      req.queryObj.search_vector = { $partialMatches: query };
      req.queryObj.status = { $in: [ 'accepted', 'submitted', 'denied' ] };
      next();
    }
  , m.sort('-id')
  , m.queryOptions({
      limit: 10
    , one: [
        { table: 'restaurants', alias: 'restaurant' }
      , { table: 'users', alias: 'user' }
      ]
    })
  , m.find( db.orders )
  );

  app.get('/api/orders/:id'
  , m.restrict(['admin'])
  , m.getOrder2({
      param:              'id'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , function( req, res ){ res.json( req.order ); }
  );

  app.put('/api/orders/silent/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.queryOptions({
      returning: ['*', {
        type: 'select'
        , table: 'orders'
        , columns: ['type']
        , alias: 'old_type'
        , where: { id: '$orders.id$' }
      }]
    })
  , m.audit.orderType()
  , m.update( db.orders )
  );

  app.put('/api/orders/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.queryOptions({
      returning: ['*', {
        type: 'select'
      , table: 'orders'
      , columns: ['type']
      , alias: 'old_type'
      , where: { id: '$orders.id$' }
      }]
    })
  , m.audit.orderType()
  , m.after( function( req, res, next ){
      if ( res.statusCode >= 300 || res.statusCode < 200 ){
        return next();
      }

      var id = req.params.id || req.query.id || req.body.id;
      var payment_status = req.params.payment_status || req.query.payment_status || req.body.payment_status;
      venter.emit( 'order:change', id );
      venter.emit('order:paymentStatus:change', payment_status, id);

      next();
    })
  , m.update( db.orders, {
      callback: function(err, orders) {
        var orderTypeChanged = orders &&
                               orders[0] &&
                               orders[0].type !== orders[0].old_type;

        if ( orderTypeChanged ){
          var order = orders[0];
          venter.emit('order:type:change', order.type, order.old_type, order);
        }
      }
    })
  );

  app.delete('/api/orders/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.orders )
  );

  app.get('/api/orders/:id/delivery-fee'
  , m.getOrder2({
      param:              'id'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , location:           true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , controllers.orders.getDeliveryFee
  );

  app.get('/api/orders/:oid/items'
  , m.getOrder2({
      param:              'oid'
    , items:              true
    , user:               true
    , userAddresses:      true
    , userPaymentMethods: true
    , restaurant:         true
    , deliveryService:    true
    })
  , controllers.orders.auth
  , m.editOrderAuth
  , m.restrict(['admin', 'order-owner', 'order-editor'])
  , controllers.orders.orderItems.list
  );

  app.post('/api/orders/:order_id/generate_edit_token'
  , m.getOrder2({ param: 'order_id' })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'admin'])
  , controllers.orders.generateEditToken
  );

  app.post('/api/orders/:oid/rebuild-pdf/:type'
  , m.restrict(['admin'])
  , controllers.orders.rebuildPdf
  );

  app.get('/api/orders/:oid/notifications'
  , m.restrict(['admin'])
  , controllers.orders.notifications.JSON.list
  );

  app.post('/api/orders/:oid/notifications/:id'
  , m.restrict(['admin'])
  , controllers.orders.notifications.JSON.sendNotification
  );

  app.get('/api/orders/:oid/notifications-history'
  , m.restrict(['admin'])
  , controllers.orders.notifications.JSON.history
  );

  app.get('/api/orders/:oid/notifications-history/:id'
  , m.restrict(['admin'])
  , controllers.orders.notifications.JSON.historyItem
  );

  app.post('/api/orders/:order_id/internal-notes'
  , m.restrict(['admin'])
  , function( req, res, next ){
      req.body.order_id = req.params.order_id;
      req.body.user_id = req.user.attributes.id;
      return next();
    }
  , function( req, res, next ){
      req.queryOptions.returning = db.order_internal_notes.getColumnListForTimezone(
        req.user.attributes.region.timezone
      );

      return next();
    }
  , function( req, res, next ){
      m.db.order_internal_notes.insert( req.body, req.queryOptions )( req, res, next );
    }
  , function( req, res, next ){
      res.locals.order_internal_note.user = req.user.attributes;
      return next();
    }
  , m.jsonLocals('order_internal_note')
  );

  app.del('/api/orders/:order_id/internal-notes/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.order_internal_notes )
  );

  /**
   * Users
   */

  app.post('/api/users/:uid/rewards'
  , m.restrict(['admin', 'client'])
  , m.owner()
  , controllers.users.rewards.redeem
  );

  /**
   * Delivery Services
   */

  app.get('/api/delivery-services'
  , m.restrict(['admin'])
  , m.sort('-id')
  , m.param('region_id')
  , m.queryOptions({
      many: [{ table: 'delivery_service_zips', alias: 'zips' }]
    , one:  [{ table: 'regions', alias: 'region' }]
    })
  , m.find( db.delivery_services )
  );

  app.post('/api/delivery-services'
  , m.restrict(['admin'])
  , m.insert( db.delivery_services )
  );

  app.get('/api/delivery-services/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.findOne( db.delivery_services )
  );

  app.put('/api/delivery-services/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.update( db.delivery_services )
  );

  app.delete('/api/delivery-services/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.delivery_services )
  );

  app.get('/api/users'
  , m.restrict(['admin'])
  , m.sort('-id')
  , m.queryOptions({
      many: [{ table: 'addresses' }, { table: 'orders' }]
    })
  , m.find( db.users )
  );

  app.get('/api/users/me'
  , function( req, res ){
      delete req.user.attributes.password;
      res.json( req.user );
    }
  );

  app.get('/api/users/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.sort('-id')
  , m.queryOptions({
      many: [
        { table: 'addresses' }
      , { table: 'users_groups', alias: 'groups' }
      ]
    })
  , m.find( db.users )
  );

  app.put('/api/users/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.updateStripeCustomer({ required: 'user', pick: ['name'] })
  , m.update( db.users )
  );

  app.delete('/api/users/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.users )
  );

  /**
   * User Invoices
   */

  app.get('/api/invoices'
  , m.restrict(['admin'])
  , m.sort('-id')
  , m.pagination({ allowLimit: true })
  , m.param('user_id')
  , m.param( 'from', function( value, $where, $options ){
      utils.defaults( $where, {
        billing_period_start: {}
      });

      $where.billing_period_start.$gte = value;
    })
  , m.param( 'to', function( value, $where, $options ){
      utils.defaults( $where, {
        billing_period_end: {}
      });

      $where.billing_period_end.$lt = value;
    })
  , m.find( db.user_invoices )
  );

  app.post('/api/invoices'
  , m.restrict(['admin'])
  , m.insert( db.user_invoices )
  );

  app.get('/api/invoices/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.sort('-id')
  , m.queryOptions({
      one:  [ { table: 'users', alias: 'user' } ]
    , many: [ { table: 'user_invoice_orders'
              , alias: 'orders'
              , mixin: [{ table: 'orders' }]
              }
            ]
    })
  , m.findOne( db.user_invoices )
  );

  app.put('/api/invoices/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.update( db.user_invoices )
  );

  app.delete('/api/invoices/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.user_invoices )
  );

  app.post('/api/invoices/:id/emails'
  , m.restrict(['admin'])
  , controllers.api.invoices.sendEmail
  );

  app.post('/api/invoices/:user_invoice_id/orders/:order_id'
  , m.restrict(['admin'])
  , m.queryToBody('user_invoice_id')
  , m.queryToBody('order_id')
  , m.insert( db.user_invoice_orders )
  );

  app.delete('/api/invoices/:user_invoice_id/orders/:order_id'
  , m.restrict(['admin'])
  , m.param('user_invoice_id')
  , m.param('order_id')
  , m.remove( db.user_invoice_orders )
  );

  /**
   * Amenities
   */

  app.post('/api/amenities'
  , m.restrict(['admin'])
  , m.insert( db.amenities )
  );

  app.get('/api/amenities/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.findOne( db.amenities )
  );

  app.put('/api/amenities/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.update( db.amenities )
  );

  app.patch('/api/amenities/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.update( db.amenities )
  );

  app.delete('/api/amenities/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.amenities )
  );

  /**
   * Order amenities
   */

  app.post('/api/orders/:order_id/amenities'
  , m.getOrder2({ param: 'order_id' })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'admin'])
  , m.insert( db.order_amenities )
  );

  // list amenities per order
  app.get('/api/orders/:order_id/amenities'
  , m.getOrder2({ param: 'order_id' })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'admin'])
  , m.param('order_id')
  , m.find( db.order_amenities )
  );

  // list specific order amenity
  app.get('/api/orders/:order_id/amenities/:amenity_id'
  , m.getOrder2({ param: 'order_id' })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'admin'])
  , m.param('order_id')
  , m.param('amenity_id')
  , m.find( db.order_amenities )
  );

  // delete all order amenities
  app.delete('/api/orders/:order_id/amenities'
  , m.getOrder2({ param: 'order_id' })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'admin'])
  , m.param('order_id')
  , m.remove( db.order_amenities )
  );

  // delete specific order amenity
  app.delete('/api/orders/:order_id/amenities/:amenity_id'
  , m.getOrder2({ param: 'order_id' })
  , controllers.orders.auth
  , m.restrict(['order-owner', 'admin'])
  , m.param('order_id')
  , m.param('amenity_id')
  , m.remove( db.order_amenities )
  );

  /**
  * Order Feedback
  */
  app.put('/api/orders/:order_id/feedback'
  , m.getOrder2({ param: 'order_id'})
  , controllers.orders.auth
  , m.restrict(['order-owner', 'admin'])
  , m.queryOptions({ returning: ['id'] })
  , m.param('order_id')
  , m.update( db.order_feedback )
  );


  app.get('/api/restaurant-plans'
  , m.restrict(['admin'])
  , m.sort('-id')
  , m.find( db.restaurant_plans )
  );

  app.post('/api/restaurant-plans'
  , m.restrict(['admin'])
  , m.insert( db.restaurant_plans )
  );

  app.get('/api/restaurant-plans/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.findOne( db.restaurant_plans )
  );

  app.put('/api/restaurant-plans/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.update( db.restaurant_plans )
  );

  app.patch('/api/restaurant-plans/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.update( db.restaurant_plans )
  );

  app.delete('/api/restaurant-plans/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.restaurant_plans )
  );

  /**
   * Maps
   */

  app.get('/api/maps/geocode/:address'
  , controllers.api.maps.geocode
  );

  app.get('/api/stripe-events/:id'
  , m.restrict(['admin'])
  , m.stripe.getStripeEvent()
  );

  app.post('/hooks/stripe'
  , m.stripe.insertStripeEvent()
  );
}
