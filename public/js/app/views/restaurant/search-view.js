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
      analytics.track('Filter Change', { type: 'Sorting' });
      this.trigger('sort:change');
    }

  });
});
