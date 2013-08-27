var controllers = require('./controllers');
var static = require('node-static');
var restrict = require('./middleware/restrict');

var file = new static.Server('./public');

module.exports.register = function(app) {

  // just going to put this here until I figure out where it should go.
  app.get('/edit-restaurant/:rid', controllers.restaurants.edit);

  app.get('/', restrict(['client', 'admin']), function(req, res) { res.redirect('/restaurants'); });

  /**
   * Restaurants resource.  The collection of all restaurants.
   */

  app.get('/restaurants', restrict(['client', 'admin']), controllers.restaurants.list);

  app.post('/restaurants', restrict('admin'), controllers.restaurants.create);

  app.all('/restaurants', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Restaurant resource.  An individual restaurant.
   */

  app.get('/restaurants/:rid', restrict(['client', 'admin']), controllers.restaurants.orders.current);  // individual restaurant needs current order.

  app.get('/restaurants/:rid', restrict(['client', 'admin']), controllers.restaurants.get);

  app.put('/restaurants/:rid', restrict('admin'), controllers.restaurants.update);

  app.all('/restaurants/:rid', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT');
    res.send(405);
  });

  /**
   * Restaurant items resource.  The collection of all items belonging to a restaurant.
   */

  app.get('/restaurants/:rid/items', restrict(['client', 'admin']), controllers.restaurants.listItems);  // not currently used

  app.all('/restaurants/:rid/items', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   * Restaurant categories resource.  The collection of all categories belonging to a restaurant.
   */

  app.get('/restaurants/:rid/categories', restrict(['client', 'admin']), controllers.restaurants.categories.list);  // not currently used

  app.post('/restaurants/:rid/categories', restrict('admin'), controllers.restaurants.categories.create);

  app.all('/restaurants/:rid/categories', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Individual category resource.  A single restaurant category.
   */

  app.get('/restaurants/:rid/categories/:cid', restrict(['client', 'admin']), controllers.restaurants.categories.get);  // not currently used

  app.put('/restaurants/:rid/categories/:cid', restrict('admin'), controllers.restaurants.categories.update);

  app.del('/restaurants/:rid/categories/:cid', restrict('admin'), controllers.restaurants.categories.remove);

  app.all('/restaurants/:rid/categories/:cid', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, DELETE');
    res.send(405);
  });

  /**
   *  Category items resource.  The collection of all items belonging to a single category.
   */

  app.get('/restaurants/:rid/categories/:cid/items', restrict(['client', 'admin']), controllers.restaurants.categories.listItems);  // not currently used

  app.post('/restaurants/:rid/categories/:cid/items', restrict('admin'), controllers.restaurants.categories.addItem);

  app.all('/restaurants/:rid/categories/:cid/items', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Restaurant orders resource.  The collection of all orders belonging to a single restaurant.
   */

  app.get('/restaurants/:rid/orders', restrict('admin'), controllers.restaurants.orders.list);

  app.post('/restaurants/:rid/orders', restrict(['client', 'admin']), function(req, res, next) {
    req.body.restaurant_id = req.params.rid;
    req.url = '/orders';
    next();
  });

  app.all('/restaurants/:rid/orders', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Current order resource.  The current pending order for the given restaurant and logged in user.
   */

  app.all('/restaurants/:rid/orders/current(/*)?', restrict(['client', 'admin']), controllers.restaurants.orders.current);

  /**
   *  Items resource.  The collection of all items.
   */

  app.get('/items', restrict(['client', 'admin']), controllers.items.list);  // not currently used

  app.all('/items', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Item resource.  An individual item.
   */

  app.get('/items/:id', restrict(['client', 'admin']), controllers.items.get);  // not currently used

  app.put('/items/:id', restrict('admin'), controllers.items.update);

  app.del('/items/:id', restrict('admin'), controllers.items.remove);

  app.all('/items/:id', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST, DELETE');
    res.send(405);
  });

  /**
   *  Orders resource.  The collection of all orders.
   */

  app.get('/orders', restrict('admin'), controllers.orders.list);  // not currently used

  app.post('/orders', restrict(['client', 'admin']), controllers.orders.create);

  app.all('/orders', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Order resource.  An individual order.
   */

  app.all('/orders/:id/?*', controllers.orders.auth);

  app.get('/orders/:id', controllers.orders.get);

  app.put('/orders/:id', restrict(['client', 'admin']), controllers.orders.update);

  app.del('/orders/:id', restrict(['client', 'admin']), function(req, res, next) {
    req.body = {status: 'canceled'};
    next();
  }, controllers.orders.changeStatus);

  app.all('/orders/:id', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST, DELETE');
    res.send(405);
  });

  /**
   *  Order status resource.  The collection of all statuses on a single order.
   */

  app.get('/orders/:oid/status-history', restrict(['client', 'admin']), controllers.orders.listStatus); // latest is on order.  not currently used.

  app.post('/orders/:oid/status-history', restrict(['client', 'admin']), controllers.orders.changeStatus);

  app.all('/orders/:id/status-history', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order items resource.  The collection of all order items on a single order.
   *  This is a collection of OrderItems, not Items.
   */

  app.get('/orders/:oid/items', restrict(['client', 'admin']), controllers.orders.orderItems.list);  // not currently used

  app.post('/orders/:oid/items', restrict(['client', 'admin']), controllers.orders.orderItems.add);

  app.all('/orders/:oid/items', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order item resource.  A single order item.
   */

  app.get('/orders/:oid/items/:iid', restrict(['client', 'admin']), controllers.orders.orderItems.get);  // not currently used

  app.put('/orders/:oid/items/:iid', restrict(['client', 'admin']), controllers.orders.orderItems.update);

  app.patch('/orders/:oid/items/:iid', restrict(['client', 'admin']), controllers.orders.orderItems.update);

  app.del('/orders/:oid/items/:iid', restrict(['client', 'admin']), controllers.orders.orderItems.remove);

  app.all('/orders/:oid/items/:iid', restrict(['client', 'admin']), function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');
    res.send(405);
  });

  /**
   *  Auth page resource.  Simple static login/register page.
   *  Also includes /logout route as a convienence so people can logout by loading a url.
   */

  app.get('/auth', controllers.auth.index);

  app.all('/auth', function(req, res, next) {
    res.set('Allow', 'GET');
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
  app.get('/session/order-params', restrict(['client', 'admin']), controllers.session.getOrderParams);

  app.put('/session/order-params', restrict(['client', 'admin']), controllers.session.updateOrderParams);

  /**
   *  Users resource.  All the users.
   */

  app.get('/users', restrict('admin'), controllers.users.list); // not currently used

  app.post('/users', restrict('admin'), controllers.users.create);

  app.all('/users', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Current user resource.
   */

  app.all ('/users/me/?*', function(req, res, next) {
    if (!req.session.user) res.send(404);
    else {
      req.url = req.url.replace(/^\/users\/me/, '/users/' + req.session.user.id);
      next();
    }
  });

  app.all('/users/:uid/?*', function(req, res, next) {
    if (!req.session.user || (req.session.user.groups.indexOf('admin') === -1 && ''+req.params.uid !== ''+req.session.user.id))
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

  app.get('/contact-us', controllers.statics.contactUs);

  app.get('/legal', controllers.statics.legal);

  app.get('/privacy', controllers.statics.privacy);

  app.get('/*', function(req, res) {
    file.serve(req, res);
  });
}
