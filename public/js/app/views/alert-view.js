define(function(require, exports, module) {
  var utils = require('utils');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({

    initialize: function() {
    },

    /**
     * Dismiss alert
     */
    dismiss: function() {
      this.$el.empty();
      return this;
    },

    /**
     * Show alert
     *
     * @param {object} context - data passed to alert template
     */
    show: function(context) {
      if (typeof context === 'string') {
        context = { type: context };
      }
      var html = Handlebars.partials.form_alert(context);
      this.$el.html(html);
      return this;
    }

  });
});
