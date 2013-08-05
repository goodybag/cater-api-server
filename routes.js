var controllers = require('./controllers');
var static = require('node-static');

var file = new static.Server('./public');

module.exports.register = function(app) {
  app.get('/restaurants', controllers.restaurants.list);

  app.get('/restaurants/:id', controllers.restaurants.get);

  app.get('/restaurants/:id/items', controllers.restaurants.listItems);

  app.get('/items', controllers.items.list);

  app.get('/items/:id', controllers.items.get);

  app.get('/*', function(req, res) {
    file.serve(req, res);
  });
}
