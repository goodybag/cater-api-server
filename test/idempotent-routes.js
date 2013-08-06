var app = require('../app');
var omf = require('omf');

omf(app, function(app) {
  app.get('/auth');
  app.get('/restaurants');
  app.get('/items');
  app.get('/orders');
});
