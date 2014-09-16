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
var PaymentSummaryItem = require('./public/js/app/models/payment-summary-item');

var m = utils.extend(
  {}
, require('stdm')
, require('dirac-middleware')
, require('./middleware/util')
, require('./middleware')
);

module.exports.register = function(app) {
  logger.info('Registering routes');

  app.before( m.analytics, m.queryParams(), function( app ){
    app.get('/', m.findRegions({ is_hidden: false}), controllers.auth.index);
    app.get('/login', controllers.auth.login);
    app.post('/login', controllers.auth.login);
    app.get('/join', m.findRegions({ is_hidden: false}), controllers.auth.registerView);
    app.post('/join', m.findRegions({ is_hidden: false}), controllers.auth.register);

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


  /**
   * Restaurants resource.  The collection of all restaurants.
   */

  app.get('/restaurants'
  , m.restrict(['client', 'restaurant', 'admin'])
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
  , m.editOrderAuth
  , m.restrict(['client', 'admin'])
  , controllers.restaurants.get);

  app.put('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.update);

  app.patch('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.update);

  app.del('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.remove);

  app.all('/restaurants/:rid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  app.get('/admin'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'home' })
  , m.view( 'admin/home', { layout: 'admin/layout2' } )
  );

  app.get('/admin/query-inspector'
  , m.view( 'admin/query-inspector', { layout: 'admin/layout2' } )
  );

  /**
   * Regions
   */

  app.get('/admin/regions'
  , m.restrict('admin')
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
  , m.view( 'admin/kitchen-sink', {
      layout: 'admin/layout2'
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
   * Restaurant list
   */

  app.get('/admin/restaurants'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.db.restaurants.find( {}, {
      limit: 'all'
    , order: 'name'
    })
  , m.view('admin/restaurant/edit-restaurants', {
      layout: 'admin/layout-page'
    })
  );

  /**
   * Restaurant create
   */

  app.get('/admin/restaurants/create'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.states()
  , m.view('admin/restaurant/create', { layout: 'admin/layout-page' })
  );

  app.post('/admin/restaurants/create'
  , m.restrict('admin')
  , controllers.restaurants.create
  );

  /**
   * Restaurant edit resource
   */

  app.get('/admin/restaurants/:rid'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'basic-info'} )
  , m.db.regions.find( {}, { limit: 'all' } )
  , m.restaurant( {param: 'rid' } )
  , m.view('admin/restaurant/edit-basic-info', {
      layout: 'admin/layout-two-column'
    })
  );

  app.put('/admin/restaurants/:rid'
  , m.restrict('admin')
  , controllers.restaurants.update
  );

  app.get('/admin/restaurants/:rid/basic-info'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'basic-info'} )
  , m.db.regions.find( {}, { limit: 'all' } )
  , m.restaurant( {param: 'rid' } )
  , m.view('admin/restaurant/edit-basic-info', {
      layout: 'admin/layout-two-column'
    })
  );

  app.get('/admin/restaurants/:rid/billing-info'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'billing-info'} )
  , m.states()
  , m.db.regions.find( {}, { limit: 'all' } )
  , m.restaurant( {param: 'rid' } )
  , m.view('admin/restaurant/edit-billing-info', {
      layout: 'admin/layout-two-column'
    })
  );

  app.get('/admin/restaurants/:rid/delivery-settings'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'delivery-settings'} )
  , m.restaurant( {param: 'rid' } )
  , m.view('admin/restaurant/edit-delivery-settings', {
      layout: 'admin/layout-two-column'
    })
  );

  app.get('/admin/restaurants/:rid/hours-of-operation'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'hours-of-operation'} )
  , m.restaurant( {param: 'rid' } )
  , m.view('admin/restaurant/hours-of-operation', {
      layout: 'admin/layout-two-column'
    })
  );

  app.get('/admin/restaurants/:rid/tags'
  , m.restrict('admin')
  , m.enums()
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'tags'} )
  , m.restaurant( {param: 'rid' } )
  , m.view('admin/restaurant/edit-tags', {
      layout: 'admin/layout-two-column'
    })
  );

  app.get('/admin/restaurants/:rid/address'
  , m.restrict('admin')
  , m.states()
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'address'} )
  , m.restaurant( {param: 'rid' } )
  , m.view('admin/restaurant/edit-address', {
      layout: 'admin/layout-two-column'
    })
  );

  app.get('/admin/restaurants/:restaurant_id/contacts'
  , m.restrict(['admin'])
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'contacts'} )
  , m.param('restaurant_id')
  , m.sort('+id')
  , m.restaurant( { param: 'restaurant_id' } )
  , m.view('admin/restaurant/edit-contacts', db.contacts, {
      layout: 'admin/layout-two-column'
    , method: 'find'
    })
  );

  app.get('/admin/restaurants/:rid/menu'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'menu'} )
  , m.restaurant( { param: 'rid', withMenuItems: true } )
  , m.view('admin/restaurant/edit-menu', {
      layout: 'admin/layout-two-column'
    })
  );

  app.get('/admin/restaurants/:restaurant_id/photos'
  , m.restrict('admin')
  , m.viewPlugin( 'mainNav', { active: 'restaurants' })
  , m.defaultLocals( { active_tab: 'photos'} )
  , m.restaurant( { param: 'restaurant_id' } )
  , m.param('restaurant_id')
  , m.sort('+priority')
  , m.view('admin/restaurant/edit-photos', db.restaurant_photos, {
      layout: 'admin/layout-two-column'
    , method: 'find'
    })
  );

  app.get('/admin/restaurants/:rid/sort', m.restrict('admin'), controllers.restaurants.sort);

  /**
   * Restaurant copy
   */
   
  app.get('/admin/restaurants/:restaurant_id/copy'
  , m.restrict('admin')
  , controllers.restaurants.copy
  );

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

  app.del('/restaurants/:rid/events/:eid', m.restrict(['admin']), controllers.restaurants.events.remove);

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

  app.del('/restaurants/:rid/categories/:cid', m.restrict('admin'), controllers.restaurants.categories.remove);

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

  app.get('/restaurants/:rid/orders'
  , function(req, res, next) {
      req.order = {};
      if (isNaN(parseInt(req.params.rid))) return res.error(errors.internal.UNKNOWN);

      if (utils.contains(req.user.attributes.groups, 'admin')){
        req.order.isAdmin = true;
        return next();
      }

      if (
           utils.contains(req.user.attributes.groups, 'restaurant')
        && utils.contains(req.user.attributes.restaurant_ids, parseInt(req.params.rid))
      ) {
        req.order.isRestaurantManager = true;
        return next();
      }

      return res.error(errors.auth.NOT_ALLOWED);
    }
  , controllers.restaurants.orders.list
  );

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

  app.del('/items/:id', m.restrict('admin'), controllers.items.remove);

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
  , m.param( 'type')
  , m.sort('-id')
  , m.queryOptions({
      one: [
        { table: 'users',       alias: 'user' }
      , { table: 'restaurants', alias: 'restaurant' }
      ]
    })
  , function( req, res, next ){
      res.locals.status = req.param('status');
      if ( req.param('status') == 'accepted' ){
        req.queryOptions.statusDateSort = { status: req.param('status') };
      }
      return next();
    }
  , m.view('orders', db.orders)
  );

  app.post('/orders', m.restrict(['client', 'admin']), controllers.orders.create);

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
  , m.getOrder({
      withItems:    true
    , withManifest: true
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

  app.get(
    config.receipt.orderRoute
  , m.basicAuth()
  , m.restrict(['admin', 'receipts'])
  , function(req,res, next){ req.order = {}; next(); } // normally this would get added in orders.auth, but we don't hit that from here
  , function(req, res, next){ req.params.receipt = true; next(); }
  , controllers.orders.get
  );

  app.all(/^\/orders\/(\d+)(?:\/.*)?$/
  , function (req, res, next) {
      req.params.id = req.params[0];
      next();
    }
  , m.getOrder2({ param: 'id' })
  , controllers.orders.auth
  );

  app.get('/orders/:oid'
    // If they're using ?receipt=true, make sure we restrict the group
  , function(req, res, next){
      // If they were using a review_token we don't need to worry about it
      // since the controllers.orders.auth middleware would have taken care of it
      if (req.param('review_token') && !req.param('receipt')) return next();

      return (
        m.restrict(!req.param('receipt') ? ['admin', 'restaurant', 'client'] : ['admin', 'restaurant', 'receipts'])
      )(req, res, next);
    }
  , controllers.orders.get
  );

  app.put('/orders/:oid', m.restrict(['client', 'admin']), controllers.orders.update);

  app.patch('/orders/:oid', m.restrict(['client', 'restaurant', 'admin']), controllers.orders.editability, controllers.orders.update);

  app.del('/orders/:oid', m.restrict(['client', 'admin']), function(req, res, next) {
    req.body = {status: 'canceled'};
    next();
  }, controllers.orders.changeStatus);

  app.all('/orders/:oid', m.restrict(['client', 'restaurant', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST, PUT, PATCH, DELETE');
    res.send(405);
  });

  app.get('/receipts/order-:oid.pdf', m.s3({
    path:   '/' + config.receipt.fileName
  , key:    config.amazon.awsId
  , secret: config.amazon.awsSecret
  , bucket: config.receipt.bucket
  }));

  /**
   *  Order status resource.  The collection of all statuses on a single order.
   */

  app.get('/orders/:oid/status-history', m.restrict(['client', 'admin']), controllers.orders.listStatus); // latest is on order.  not currently used.

  // people with restaurant review token can access this route.  leave auth to controllers.orders.auth.
  app.post('/orders/:oid/status-history', controllers.orders.changeStatus);

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
  
  app.get('/api/orders/:oid/items'
  , m.restrict(['client', 'restaurant', 'admin'])
  , controllers.orders.orderItems.summary
  );

  app.post('/api/orders/:oid/items'
  , m.editOrderAuth
  , m.restrict(['client', 'admin'])
  , controllers.orders.editability
  , controllers.orders.orderItems.add
  );

  app.all('/api/orders/:oid/items', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order item resource.  A single order item.
   */

  app.get('/api/orders/:oid/items/:iid'
  , m.restrict(['client', 'admin'])
  , controllers.orders.orderItems.get
  );

  app.put('/api/orders/:oid/items/:iid'
  , m.editOrderAuth
  , m.restrict(['client', 'admin'])
  , controllers.orders.editability
  , controllers.orders.orderItems.update
  );

  app.patch('/api/orders/:oid/items/:iid'
  , m.editOrderAuth
  , m.restrict(['client', 'admin'])
  , controllers.orders.editability
  , controllers.orders.orderItems.update
  );

  app.del('/api/orders/:oid/items/:iid'
  , m.editOrderAuth
  , m.restrict(['client', 'admin'])
  , controllers.orders.editability
  , controllers.orders.orderItems.remove
  );

  app.all('/orders/:oid/items/:iid'
  , m.restrict(['client', 'admin'])
  , function(req, res, next) {
      res.set('Allow', 'GET, PUT, PATCH, DELETE');
      res.send(405);
    }
  );

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

  app.get('/orders/:oid/add-items', m.restrict(['client', 'admin']), controllers.restaurants.orders.get);

  app.all('/orders/:oid/add-items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  app.get('/orders/:oid/notifications/:nid'
  , m.restrict(['admin'])
  , controllers.orders.notifications.getEmail
  );

  /**
   * Reporting resource
   */

  app.get('/reports'
  , m.restrict(['admin'])
  , m.findRegions()
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

  app.del('/session', controllers.session.del)

  app.all('/session', function(req, res, next) {
    res.set('Allow', 'GET, POST, DELETE');
    res.send(405);
  });


  // For the order params
  app.get('/session/order-params', m.restrict(['client', 'admin']), controllers.session.getOrderParams);

  app.put('/session/order-params', m.restrict(['client', 'admin']), controllers.session.updateOrderParams);

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

  app.post('/users', m.restrict('admin'), controllers.users.create);

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

    app.put('/users/:uid', restrictUpdate, controllers.users.update);
    app.patch('/users/:uid', restrictUpdate, controllers.users.update);

    app.del('/users/:uid', function(req, res) { res.send(501); });

    app.all('/users/:uid', function(req, res, next) {
      res.set('Allow', 'GET, PUT, DELETE');
      res.send(405);
    });

    /**
     *  User Orders resource.  All the orders placed by an individual user.
     */

    app.get('/users/:uid/orders', controllers.users.listOrders);

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

    app.del('/users/:uid/addresses/:aid', controllers.users.addresses.remove);

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

    app.del('/users/:uid/cards/:cid', controllers.users.cards.remove);

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

  app.get('/admin/restaurants/:id/payment-summaries'
  , m.restrict(['admin'])
  , m.param('id')
  , m.view( 'admin/restaurant-payment-summaries', db.restaurants, {
      layout: 'admin/layout'
    , method: 'findOne'
    })
  );

  app.get('/admin/restaurants/:id/payment-summaries/:payment_summary_id'
  , m.restrict(['admin'])
  , m.param('id')
  , function( req, res, next ){
      res.locals.payment_summary_id = req.param('payment_summary_id');
      return next();
    }
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
  , m.param('id')
  , m.queryOptions({
      one:  [ { table: 'restaurants', alias: 'restaurant' }
            , { table: 'users', alias: 'user' }
            ]
    , many: [{ table: 'order_items', alias: 'items' }]
    })
  , m.view( 'admin/order', db.orders, {
      layout: 'admin/layout2'
    , method: 'findOne'
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
  , function( req, res, next ){
      var $query = { payment_summary_id: req.param('id') };
      db.payment_summary_items.find( $query, function( error, results ){
        if ( error ) return res.error(500);

        res.locals.payment_summary_items = results.map( function( r ){
          return new PaymentSummaryItem( r ).toJSON();
        });

        next();
      });
    }
  , m.view( 'invoice/payment-summary', db.payment_summaries, {
      layout: 'invoice/payment-summary-layout'
    , method: 'findOne'
    })
  );

  app.get('/api/restaurants/:restaurant_id/orders'
  , m.pagination({ allowLimit: true })
  , m.param('restaurant_id')
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

  app.del('/api/restaurants/:restaurant_id/contacts/:id'
  , m.restrict( ['admin'] )
  , m.param('restaurant_id')
  , m.param('id')
  , m.remove( db.contacts )
  );

  app.get('/api/restaurants/:restaurant_id/payment-summaries'
  , m.pagination({ allowLimit: true })
  , m.param('restaurant_id')
  , m.find( db.payment_summaries )
  );

  app.post('/api/restaurants/:restaurant_id/payment-summaries'
    // Ensure restaurant ID in the URL is what is in the body
  , m.queryToBody('restaurant_id')
  , m.insert( db.payment_summaries )
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

  app.del('/api/restaurants/:restaurant_id/payment-summaries/:id'
  , m.param('id')
  , m.param('restaurant_id')
  , m.remove( db.payment_summaries )
  );

  app.get('/api/restaurants/:restaurant_id/payment-summaries/:payment_summary_id/items'
  , m.pagination()
  , controllers.paymentSummaries.applyRestaurantId()
  , m.param('payment_summary_id')
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

  app.del('/api/restaurants/:restaurant_id/payment-summaries/:payment_summary_id/items/:id'
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

  app.del('/api/restaurants/:restaurant_id/photos/:id'
  , m.restrict( ['admin'] )
  , m.param('restaurant_id')
  , m.param('id')
  , m.remove( db.restaurant_photos )
  );

  app.get('/api/orders'
  , m.restrict(['admin'])
  , m.pagination()
  , m.param('status')
  , function( req, res, next ){
      res.locals.status = req.param('status');
      if ( req.param('status') == 'accepted' ){
        req.queryOptions.statusDateSort = { status: req.param('status') };
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
  , m.param('id')
  , m.queryOptions({
      one: [
        { table: 'users',       alias: 'user' }
      , { table: 'restaurants', alias: 'restaurant' }
      ]
    })
  , m.findOne( db.orders )
  );

  app.put('/api/orders/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.after( function( req, res, next ){
      if ( res.statusCode >= 300 || res.statusCode < 200 ){
        return next();
      }

      venter.emit( 'order:change', req.param('id') );
      next();
    })
  , m.update( db.orders )
  );

  app.del('/api/orders/:id'
  , m.restrict(['admin'])
  , m.param('id')
  , m.remove( db.orders )
  );

  app.get('/api/orders/:oid/items'
  , m.editOrderAuth
  , m.restrict(['client', 'admin'])
  , controllers.orders.orderItems.list
  );

  app.post('/api/orders/:order_id/generate_edit_token'
  , m.restrict(['client', 'admin'])
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

  app.del('/api/delivery-services/:id'
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

}
