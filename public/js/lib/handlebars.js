define(function(require, exports, module) {
  var Handlebars = require('hbs');
  var helpers = require('hb-helpers');

  require('partials');

  for (var key in helpers) {
    Handlebars.registerHelper(key, helpers[key]);
  }

  // for Handlebars partials replace dashes with underscores
  // (alternatively, have filenames with underscores instead of hyphens)
  var newPartials = {};
  Handlebars.partials = _.map(Handlebars.partials, function(value, key) {
    newPartials[key.replace(/-/g, '_')] = value;
  });
  Handlebars.partials = newPartials;

  return module.exports = Handlebars;
});