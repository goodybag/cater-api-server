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
      analytics.track('Filter Change', { type: 'Sorting' });
      this.trigger('sort:change');
    }

  , getProps: function() {
      return { sort:  this.$el.find(this.options.inputSelector || '.sort').val() };
    }

  });
});
