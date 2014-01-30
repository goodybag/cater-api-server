/**
 * This view handles sorting the restaurant listing
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');
  var utils = require('utils');

  return module.exports = Backbone.View.extend({
    events: {
      'change .sort': 'onSortChange'
    }

  , initialize: function() {

    }

  , onSortChange: function(e) {
      mixpanel.track("Restaurants List Sort");
      this.trigger('sort:change');
    }

  , getProps: function() {
      return { sort:  this.$el.find('.sort').val() };
    }

  });
});
