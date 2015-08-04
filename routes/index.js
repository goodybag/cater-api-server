var express = require('express');
var gplaces = require('gplaces');
var config = require('../config');
var controllers = require('../controllers');
var utils = require('../utils');
var venter = require('../lib/venter');
var logger = require('../lib/logger');
var Models = require('../models');
var hbHelpers = require('../public/js/lib/hb-helpers');
var db = require('../db');
var errors = require('../errors');

var m = require('../middleware')

module.exports.register = function(app) {
  logger.info('Registering routes');

  app.use(require('./public'));
  app.use('/verify', require('./verify'));
  app.use('/restaurants', require('./restaurants'));
  app.use('/admin', require('./admin'));
  app.use('/orders', require('./orders'));
  app.use('/items', require('./items'));
  app.use('/reports', require('./reports'));
  app.use('/users', require('./users'));

  // Temporary for job fair
  app.get('/fsjse.md', m.s3({
    path: '/fsjse-1.md',
    key: config.amazon.awsId,
    secret: config.amazon.awsSecret,
    bucket: config.cdn.bucket
  }));

  app.get('/jobs/customer-service-specialist.pdf', m.s3({
    path: '/customer-service-specialist-1.pdf',
    key: config.amazon.awsId,
    secret: config.amazon.awsSecret,
    bucket: config.cdn.bucket
  }));

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

  app.get('/api/places',
    m.restrict('admin'),
    gplaces.proxy({key: config.credentials['google.com'].apiKey}));

  app.get('/api/upcoming',
    m.restrict('admin'),
    m.getOrders({submittedDate: true, upcoming: '3 hours'}),
    function(req, res, next) {
      res.send(res.locals.orders);
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
