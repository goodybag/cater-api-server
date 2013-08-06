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

  app.get('/restaurants/:rid', controllers.restaurants.get);

  app.put('/restaurants/:rid', function(req, res) { res.send(501); });

  app.all('/restaurants/:rid', function(req, res, next) {
    res.set('Allow', 'GET, PUT');
    res.send(405);
  });

  /**
   * Restaurant items resource.  The collection of all items belonging to a restaurant.
   */

  app.get('/restaurants/:rid/items', controllers.restaurants.listItems);  // not currently used

  app.all('/restaurants/:rid/:items', function(req, res, next) {
    res.set('Allow', 'GET');
    res.send(405);
  });

  /**
   * Restaurant categories resource.  The collection of all categories belonging to a restaurant.
   */

  app.get('/restaurants/:rid/categories', controllers.restaurants.categories.list);  // not currently used

  app.post('/restaurants/:rid/categories', function(req, res) { res.send(501); });

  app.all('/restaurants/:rid/categories', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  /**
   * Individual category resource.  A single restaurant category.
   */

  app.get('/restaurants/:rid/categories/:cid', controllers.restaurants.categories.get);  // not currently used

  app.put('/restaurants/:rid/categories/:cid', function(req, res) { res.send(501); });

  app.del('/restaurants/:rid/categories/:cid', function(req, res) { res.send(501); });

  app.all('/restaurants/:rid/categories/:cid', function(req, res, next) {
    res.set('Allow', 'GET, PUT, DELETE');
    res.send(405);
  });

  /**
   *  Category items resource.  The collection of all items belonging to a single category.
   */

  app.get('/restaurants/:rid/categories/:cid/items', controllers.restaurants.categories.listItems);  // not currently used

  app.post('/restaurants/:rid/categories/:cid/items', function(req, res) { res.send(501); });

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

  app.put('/items/:id', function(req, res) { res.send(501); });

  app.del('/items/:id', function(req, res) { res.send(501); });

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

  app.del('/orders/:oid/items/:iid', controllers.orders.orderItems.remove);

  app.all('/orders/:oid/items/:iid', function(req, res, next) {
    res.set('Allow', 'GET, PUT, PATCH, DELETE');  // TODO: PATCH
    res.send(405);
  });

  app.get('/auth', controllers.auth.index);
  app.get('/auth/logout', controllers.session.del);

  app.post('/session', controllers.session.create);
  app.del('/session', controllers.session.del)

  app.post('/users', controllers.users.create);

  app.get('/*', function(req, res) {
    file.serve(req, res);
  });
}
