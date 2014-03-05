/**
 *
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var utils = require('utils');

  var template = Handlebars.partials.menu_order_params;

  return module.exports = Backbone.View.extend({
    events: {
      'click .highlight-link': 'highlightLink'
    },

    highlightLink: function(e) {
      var 
        x = window.scrollX
      , y = window.scrollY;
      this.$el.find('.share-link').focus();
      utils.defer(window.scrollTo.bind(window, x, y));
    }
  });
});
