var utils = require('./utils');
var helpers = require('./public/js/hb-helpers');

module.exports.register = function(handlebars) {
  for (var key in helpers) {
    handlebars.registerHelper(key, helpers[key]);
  }
}
