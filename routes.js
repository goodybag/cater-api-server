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

  app.get('/items', controllers.items.list);

  app.get('/items/:id', controllers.items.get);

  app.get('/orders', controllers.orders.list);

  app.get('/orders/:id', controllers.orders.get);

  app.get('/orders/:oid/items', controllers.orders.orderItems.list);

  app.get('/orders/:oid/items/:iid', controllers.orders.orderItems.get);

  app.get('/*', function(req, res) {
    file.serve(req, res);
  });
}
