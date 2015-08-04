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
  app.use('/api', require('./api'));

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
};
