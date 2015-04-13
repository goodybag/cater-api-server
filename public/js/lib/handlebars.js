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

  var gbHelpers = require('gb-handlebars-helpers'); // todo move all helpers to this lib
  gbHelpers.register(Handlebars);

  return module.exports = Handlebars;
});
