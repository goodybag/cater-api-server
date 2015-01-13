define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    events: {
      'submit .search-form': 'submit'
    },

    initialize: function() {
      this.options.inputSelector = this.options.inputSelector || '.search-input';
      this.options.changeEvent = this.options.changeEvent || 'search:change';
    },

    submit: function(e) {
      e.preventDefault();
      analytics.track('Filter Change', { type: 'Searching' });
      this.trigger(this.options.changeEvent);
    },

    getProps: function() {
      return { search:  this.$el.find(this.options.inputSelector).val() };
    }
  });
});
