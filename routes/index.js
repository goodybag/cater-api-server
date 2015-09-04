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

  if ( process.env.NODE_ENV !== 'production' ){
    app.get('/test-error/:status', function( req, res, next ){
      req.xhr = req.query.xhr == 'true';

      var e = new Error('Test error message');
      e.httpCode = req.params.status;

      return next( e );
    }, utils.noop );

    app.get('/test-timeout', function(){
      
    });
  }

  app.use(require('./public'));
  app.use(require('./documents'));
  app.use(require('./lunchroom'));
  app.use('/verify', require('./verify'));
  app.use('/restaurants', require('./restaurants'));
  app.use('/admin', require('./admin'));
  app.use('/orders', require('./orders'));
  app.use('/items', require('./items'));
  app.use('/reports', require('./reports'));
  app.use('/users', require('./users'));
  app.use('/api', require('./api'));

  app.get('/api/places',
    m.restrict('admin'),
    gplaces.proxy({
      key: config.credentials['google.com'].apiKey
    }));

  app.get('/api/upcoming',
    m.restrict('admin'),
    m.getOrders({
      submittedDate: true,
      upcoming: '3 hours'
    }),
    function(req, res, next) {
      res.send(res.locals.orders);
    });

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

  app.get('/faqs', m.json({
    file: '/public/data/faqs.json',
    target: 'faqs'
  }), m.view('faqs'));

  app.get('/legal', controllers.statics.legal);

  app.get('/privacy', controllers.statics.privacy);

  app.get('/analytics', m.restrict(['admin']), controllers.analytics.list);

  // For testing emails and shtuff
  app.get('/emails/:name', m.restrict(['admin']), controllers.emails.get);

  app.post('/emails/:name', m.restrict(['admin']), controllers.emails.post);

  app.get('/docs/style', m.restrict('admin'), controllers.statics.styleGuide);

  app.post('/hooks/stripe', m.stripe.insertStripeEvent());
};
