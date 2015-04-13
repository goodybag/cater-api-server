var utils = require('./utils');
var helpers = require('./public/js/lib/hb-helpers');
var gbHelpers = require('gb-handlebars-helpers'); // todo move all helpers to this lib

module.exports.register = function(handlebars) {
  for (var key in helpers) {
    handlebars.registerHelper(key, helpers[key]);
  }

  gbHelpers.register(handlebars);
}
