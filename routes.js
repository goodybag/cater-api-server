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

  app.get('/orders/:oid/items/:iid', controllers.orders.orderItems.get);

  app.del('/orders/:oid/items/:iid', controllers.orders.orderItems.remove);

  app.get('/auth', controllers.auth.index);
  app.get('/auth/logout', controllers.session.del);

  app.post('/session', controllers.session.create);
  app.del('/session', controllers.session.del)

  app.post('/users', controllers.users.create);

  app.get('/*', function(req, res) {
    file.serve(req, res);
  });
}
