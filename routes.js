var controllers = require('./controllers');
var static = require('node-static');

var file = new static.Server('./public');

module.exports.register = function(app) {
  app.get('/restaurants', controllers.restaurants.list);

  app.get('/restaurants/:id', controllers.restaurants.get);

  app.get('/restaurants/:id/items', controllers.restaurants.listItems);

  app.get('/orders', controllers.orders.list);

  app.get('/orders/:id', controllers.orders.get);

  app.get('/orders/:id/items', controllers.orders.listItems);

  app.get('/*', function(req, res) {
    file.serve(req, res);
  });
}
