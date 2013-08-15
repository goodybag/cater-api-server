var controllers = require('./controllers');
var static = require('node-static');

var file = new static.Server('./public');

module.exports.register = function(app) {
  /**
   * Restaurants resource.  The collection of all restaurants.
   */

  app.get('/restaurants', controllers.restaurants.list);

  app.post('/restaurants', controllers.restaurants.create);

  app.all('/restaurants', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Restaurant resource.  An individual restaurant.
   */

  app.get('restaurants/:rid', controllers.restaurants.orders.current);  // individual restaurant needs current order.

  app.get('/restaurants/:rid', controllers.restaurants.get);

  app.put('/restaurants/:rid', controllers.restaurants.update);

  app.all('/restaurants/:rid', function(req, res, next) {
    res.set('Allow', 'GET, PUT');
    res.send(405);
  });

  /**
   * Restaurant items resource.  The collection of all items belonging to a restaurant.
   */

  app.get('/restaurants/:rid/items', controllers.restaurants.listItems);  // not currently used

  app.all('/restaurants/:rid/items', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   * Restaurant categories resource.  The collection of all categories belonging to a restaurant.
   */

  app.get('/restaurants/:rid/categories', controllers.restaurants.categories.list);  // not currently used

  app.post('/restaurants/:rid/categories', controllers.restaurants.categories.create);

  app.all('/restaurants/:rid/categories', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Individual category resource.  A single restaurant category.
   */

  app.get('/restaurants/:rid/categories/:cid', controllers.restaurants.categories.get);  // not currently used

  app.put('/restaurants/:rid/categories/:cid', controllers.restaurants.categories.update);

  app.del('/restaurants/:rid/categories/:cid', controllers.restaurants.categories.remove);

  app.all('/restaurants/:rid/categories/:cid', function(req, res, next) {
    res.set('Allow', 'GET, PUT, DELETE');
    res.send(405);
  });

  /**
   *  Category items resource.  The collection of all items belonging to a single category.
   */

  app.get('/restaurants/:rid/categories/:cid/items', controllers.restaurants.categories.listItems);  // not currently used

  app.post('/restaurants/:rid/categories/:cid/items', controllers.restaurants.categories.addItem);

  app.all('/restaurants/:rid/categories/:cid/items', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Restaurant orders resource.  The collection of all orders belonging to a single restaurant.
   */

  app.get('/restaurants/:rid/orders', controllers.restaurants.orders.list);

  app.post('/restaurants/:rid/orders', controllers.restaurants.orders.create);

  app.all('/restaurants/:rid/orders', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Current order resource.  The current pending order for the given restaurant and logged in user.
   */

  app.all('/restaurants/:rid/orders/current(/*)?', controllers.restaurants.orders.current);

  /**
   *  Items resource.  The collection of all items.
   */

  app.get('/items', controllers.items.list);  // not currently used

  app.all('/items', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Item resource.  An individual item.
   */

  app.get('/items/:id', controllers.items.get);  // not currently used

  app.put('/items/:id', controllers.items.update);

  app.del('/items/:id', controllers.items.remove);

  app.all('/items/:id', function(req, res, next) {
    res.set('Allow', 'GET, POST, DELETE');
    res.send(405);
  });

  /**
   *  Orders resource.  The collection of all orders.
   */

  app.get('/orders', controllers.orders.list);  // not currently used

  app.all('/orders', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   *  Order resource.  An individual order.
   */

  app.get('/orders/:id', controllers.orders.get);

  app.put('/orders/:id', controllers.orders.update);

  app.del('/orders/:id', function(req, res, next) {
    req.body = {status: 'canceled'};
    next();
  }, controllers.orders.changeStatus);

  app.all('/orders/:id', function(req, res, next) {
    res.set('Allow', 'GET, POST, DELETE');
    res.send(405);
  });

  /**
   *  Order status resource.  The collection of all statuses on a single order.
   */

  app.get('/orders/:oid/status-history', controllers.orders.listStatus); // latest is on order.  not currently used.

  app.post('/orders/:oid/status-history', controllers.orders.changeStatus);

  app.all('/orders/:id/status-history', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order items resource.  The collection of all order items on a single order.
   *  This is a collection of OrderItems, not Items.
   */

  app.get('/orders/:oid/items', controllers.orders.orderItems.list);  // not currently used

  app.post('/orders/:oid/items', controllers.orders.orderItems.add);

  app.all('/orders/:oid/items', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Order item resource.  A single order item.
   */

  app.get('/orders/:oid/items/:iid', controllers.orders.orderItems.get);  // not currently used

  app.put('/orders/:oid/items/:iid', controllers.orders.orderItems.update);

  app.patch('/orders/:oid/items/:iid', controllers.orders.orderItems.update);

  app.del('/orders/:oid/items/:iid', controllers.orders.orderItems.remove);

  app.all('/orders/:oid/items/:iid', function(req, res, next) {
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
  app.get('/session/order-params', controllers.session.getOrderParams);

  app.put('/session/order-params', controllers.session.updateOrderParams);

  /**
   *  Users resource.  All the users.
   */

  app.get('/users', controllers.users.list);

  app.post('/users', controllers.users.create);

  app.all('/users', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   *  Current user resource.
   */

  app.all ('/users/me*', function(req, res, next) {
    if (!req.session.user) res.send(404);
    else {
      req.url = req.url.replace(/^\/users\/me/, '/users/' + req.session.user.id);
      next();
    }
  });

  app.all('/users/:uid/?*', function(req, res, next) {
    if (!req.session.user || ''+req.params.uid !== ''+req.session.user.id)
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

  app.get('/*', function(req, res) {
    file.serve(req, res);
  });
}
