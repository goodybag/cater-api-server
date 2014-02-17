var express = require('express');
var config = require('./config');
var controllers = require('./controllers');
var utils = require('./utils');
var Models = require('./models');
var hbHelpers = require('./public/js/lib/hb-helpers');
var errors = require('./errors');

var m = utils.extend({
  orderParams   : require('./middleware/order-params'),
  restrict      : require('./middleware/restrict'),
  basicAuth     : require('./middleware/basic-session-auth'),
  buildReceipt  : require('./middleware/build-receipt'),
  queryString   : require('./middleware/query-string')
}, require('stdm') );

module.exports.register = function(app) {

  app.before( m.applyQueryParams(), function( app ){
    app.get('/', controllers.auth.index);
    app.get('/login', controllers.auth.login);
    app.post('/login', controllers.auth.login);
    app.get('/join', controllers.auth.registerView);
    app.post('/join', controllers.auth.register);

    app.get('/forgot-password', controllers.auth.forgotPassword);
    app.post('/forgot-password', controllers.auth.forgotPasswordCreate);
    app.get('/forgot-password/:token', controllers.auth.forgotPasswordConsume);
    app.post('/forgot-password/:token', controllers.auth.forgotPasswordConsume);
  });


  /**
   * Restaurants resource.  The collection of all restaurants.
   */

  app.get('/restaurants',
    m.restrict(['client', 'restaurant', 'admin']),
    function(req, res, next) {
      if (req.query.edit) return next();
      controllers.restaurants.list.apply(this, arguments);
    }
  );

  app.get('/restaurants', m.restrict('admin'), controllers.restaurants.editAll);

  app.post('/restaurants', m.restrict('admin'), controllers.restaurants.create);

  app.all('/restaurants', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Restaurant resource.  An individual restaurant.
   */

  app.get('/restaurants/manage', m.restrict(['restaurant', 'admin']), controllers.restaurants.listManageable);

  app.get('/restaurants/:rid', m.restrict(['client', 'admin']), controllers.restaurants.orders.current);  // individual restaurant needs current order.

  app.get('/restaurants/:rid', m.restrict(['client', 'admin']), function(req, res, next) {
    if (req.query.edit) return next();
    controllers.restaurants.get.apply(this, arguments);
  });

  app.get('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.edit);

  app.put('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.update);

  app.patch('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.update);

  app.del('/restaurants/:rid', m.restrict('admin'), controllers.restaurants.remove);

  app.all('/restaurants/:rid', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  app.get('/restaurants/:rid/sort', m.restrict('admin'), controllers.restaurants.sort);

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

  app.del('/items/:id', m.restrict('admin'), controllers.items.remove);

  app.all('/items/:id', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH,  DELETE');
    res.send(405);
  });

  /**
   *  Orders resource.  The collection of all orders.
   */

  app.get('/orders', m.restrict('admin'), controllers.orders.list);  // not currently used

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

  app.get(
    config.receipt.orderRoute
  , m.basicAuth()
  , m.restrict(['admin', 'receipts'])
  , function(req,res, next){ req.order = {}; next(); } // normally this would get added in orders.auth, but we don't hit that from here
  , function(req, res, next){ req.params.receipt = true; next(); }
  , controllers.orders.get
  );

  app.all(/^\/orders\/(\d+)(?:\/.*)?$/, function (req, res, next) {
    req.params.id = req.params[0];
    next();
  }, controllers.orders.auth);

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

  app.get('/receipts/order-:oid.pdf', m.buildReceipt(), express.static(__dirname + '/public'));

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
   *  Order items resource.  The collection of all order items on a single order.
   *  This is a collection of OrderItems, not Items.
   */

  //app.get('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.orderItems.list);  // not currently used
  app.get('/orders/:oid/items', m.restrict(['client', 'restaurant', 'admin']), controllers.orders.orderItems.summary);  // not currently used

  app.post('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.orderItems.add);

  app.all('/orders/:oid/items', m.restrict(['client', 'restaurant', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order item resource.  A single order item.
   */

  app.get('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.get);  // not currently used

  app.put('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.orderItems.update);

  app.patch('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.orderItems.update);

  app.del('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.editability, controllers.orders.orderItems.remove);

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

  app.get('/orders/:oid/add-items', m.restrict(['client', 'admin']), controllers.restaurants.orders.get);

  app.all('/orders/:oid/add-items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
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

  app.get('/users', m.restrict('admin'), controllers.users.list); // not currently used

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
    if (!req.session.user) res.send(404);
    else {
      req.url = req.url.replace(/^\/users\/me/, '/users/' + req.session.user.id);
      next();
    }
  });

  app.all(/^\/users\/(\d+)(?:\/.*)?$/, function(req, res, next) {
    if (!req.session.user || (req.session.user.groups.indexOf('admin') === -1 && ''+req.params[0] !== ''+req.session.user.id))
      res.send(404);
    else
      next();
  });

  app.get('/users/:uid', controllers.users.get);

  app.put('/users/:uid', controllers.users.update);

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
}
