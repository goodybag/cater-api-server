define(function(require, exports, module) {
  var Handlebars = require('hbs');
  var helpers = require('hb-helpers');

  var partials = require('partials');

  for (var key in helpers) {
    Handlebars.registerHelper(key, helpers[key]);
  }

  // for Handlebars partials replace dashes with underscores
  // (alternatively, have filenames with underscores instead of hyphens)
  for ( var key in partials ){
    Handlebars.partials[ key.replace(/-/g, '_') ] = partials[ key ];
  }

  return module.exports = Handlebars;
});
