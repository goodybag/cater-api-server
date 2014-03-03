var utils = require('./utils');
var helpers = require('./public/js/lib/hb-helpers');

module.exports.register = function(handlebars) {
  for (var key in helpers) {
    handlebars.registerHelper(key, helpers[key]);
  }
}
