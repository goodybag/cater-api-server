var controllers = require('./controllers');
var static = require('node-static');

var file = new static.Server('./public');

module.exports.register = function(app) {
  app.get('/restaurants', controllers.restaurants.list);

  app.get('/restaurants/:id', controllers.restaurants.get);

  app.get('/restaurants/:id/items', controllers.restaurants.listItems);

  app.get('/auth', controllers.auth.index);
  app.post('/auth/login', controllers.auth.login);
  app.get('/auth/logout', controllers.auth.logout);

  app.post('/users', controllers.users.create);

  app.get('/*', function(req, res) {
    file.serve(req, res);
  });
}
