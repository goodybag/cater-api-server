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

    initialize: function() {
      this.$el.find('.learn-more').popover({
        container: 'body'
      , placement: 'left'
      , trigger: 'hover'
      , content: Handlebars.partials.share_link_popover()
      , html: true
      });
    },

    highlightLink: function(e) {
      var 
        x = window.scrollX
      , y = window.scrollY;
      this.$el.find('.share-link').select().focus();
      utils.defer(window.scrollTo.bind(window, x, y));
    }
  });
});
