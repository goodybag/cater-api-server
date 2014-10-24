define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    events: {
      'submit .search-form': 'submit'
    },

    initialize: function() {

    },

    submit: function(e) {
      e.preventDefault();
      analytics.track('Filter Change', { type: 'Searching' });
      this.trigger('search:change');
    },

    getProps: function() {
      return { search:  this.$el.find('.search-input').val() };
    }
  });
});
