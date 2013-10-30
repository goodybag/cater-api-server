var static = require('node-static');
var controllers = require('./controllers');

var m = {
  orderParams : require('./middleware/order-params'),
  restrict    : require('./middleware/restrict')
};

var file = new static.Server('./public');

module.exports.register = function(app) {

  app.get('/', m.restrict(['client', 'admin']), function(req, res) { res.redirect('/restaurants'); });

  /**
   * Restaurants resource.  The collection of all restaurants.
   */

  app.get('/restaurants',
    m.restrict(['client', 'admin']),
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

  /**
   * Restaurant items resource.  The collection of all items belonging to a restaurant.
   */

  app.get('/restaurants/:rid/items', m.restrict(['client', 'admin']), controllers.restaurants.listItems);  // not currently used

  app.all('/restaurants/:rid/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
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

  app.get('/restaurants/:rid/orders', m.restrict('admin'), controllers.restaurants.orders.list);

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

  app.all('/orders/:id', controllers.orders.auth);

  app.get('/orders/:id', controllers.orders.get);

  app.put('/orders/:id', m.restrict(['client', 'admin']), controllers.orders.update);

  app.patch('/orders/:id', m.restrict(['client', 'admin']), controllers.orders.update);

  app.del('/orders/:id', m.restrict(['client', 'admin']), function(req, res, next) {
    req.body = {status: 'canceled'};
    next();
  }, controllers.orders.changeStatus);

  app.all('/orders/:id', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST, PUT, PATCH, DELETE');
    res.send(405);
  });

  /**
   *  Order status resource.  The collection of all statuses on a single order.
   */

  app.get('/orders/:oid/status-history', m.restrict(['client', 'admin']), controllers.orders.listStatus); // latest is on order.  not currently used.

  // people with restaurant review token can access this route.  leave auth to controllers.orders.auth.
  app.post('/orders/:oid/status-history', controllers.orders.changeStatus);

  app.all('/orders/:id/status-history', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order items resource.  The collection of all order items on a single order.
   *  This is a collection of OrderItems, not Items.
   */

  //app.get('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.orderItems.list);  // not currently used
  app.get('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.orderItems.summary);  // not currently used

  app.post('/orders/:oid/items', m.restrict(['client', 'admin']), controllers.orders.orderItems.add);

  app.all('/orders/:oid/items', m.restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order item resource.  A single order item.
   */

  app.get('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.get);  // not currently used

  app.put('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.update);

  app.patch('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.update);

  app.del('/orders/:oid/items/:iid', m.restrict(['client', 'admin']), controllers.orders.orderItems.remove);

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
   *  Auth page resource.  Simple static login/register page.
   *  Also includes /logout route as a convienence so people can logout by loading a url.
   */

  app.get('/auth', controllers.auth.index);

  app.post('/auth', controllers.session.create);

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
   *  User session resource.  Represents a session as a specific user.
   */

  app.post('/users/:uid/session', controllers.users.createSessionAs);

  app.all('/users/:uid/session', function(req, res, next) {
    res.set('Allow', 'POST');
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

  app.get('/*', function(req, res) {
    file.serve(req, res, function(error){
      if ( error && error.status == 404) return res.status(404).render('404');
    });
  });
}
