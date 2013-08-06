var app = require('../app');
var omf = require('omf');

omf(app, function(app) {
  app.get('/auth');
});
