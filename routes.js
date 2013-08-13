var controllers = require('./controllers');
var static = require('node-static');

var file = new static.Server('./public');

module.exports.register = function(app) {
  app.get('/restaurants', controllers.restaurants.list);

  app.get('/restaurants/:rid', controllers.restaurants.get);

  app.get('/restaurants/:rid/items', controllers.restaurants.listItems);

  app.get('/restaurants/:rid/categories', controllers.restaurants.categories.list);

  app.get('/restaurants/:rid/categories/:cid', controllers.restaurants.categories.get);

  app.get('/restaurants/:rid/categories/:cid/items', controllers.restaurants.categories.listItems);

  app.get('/restaurants/:rid/orders', controllers.restaurants.orders.list);

  app.post('/restaurants/:rid/orders', controllers.restaurants.orders.create);

  app.get('/restaurants/:rid/orders/current/items', controllers.restaurants.orders.current.listItems);

  app.post('/restaurants/:rid/orders/current/items', controllers.restaurants.orders.current.addItem);

  app.put('/restaurants/:rid/orders/current/items/:iid', controllers.restaurants.orders.current.updateItem);

  app.del('/restaurants/:rid/orders/current/items/:iid', controllers.restaurants.orders.current.removeItem);

  app.all('/restaurants/:rid/orders', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  app.get('/items', controllers.items.list);

  app.get('/items/:id', controllers.items.get);

  app.get('/orders', controllers.orders.list);

  app.get('/orders/:id', controllers.orders.get);

  app.put('/orders/:id', controllers.orders.update);

  app.del('/orders/:id', function(req, res, next) {
    req.body = {status: 'canceled'};
    next();
  }, controllers.orders.changeStatus);

  app.get('/orders/:oid/status-history', controllers.orders.listStatus); // latest is on order

  app.post('/orders/:oid/status-history', controllers.orders.changeStatus);

  app.all('/orders/:id/status-history', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  app.get('/orders/:oid/items', controllers.orders.orderItems.list);

  app.post('/orders/:oid/items', controllers.orders.orderItems.add);

  app.all('/orders/:oid/items', function(req, res, next) {
    res.set('Allow', 'GET, POST');
    res.send(405);
  });

  app.get('/orders/:oid/items/:iid', controllers.orders.orderItems.get);

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
