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
     * @param {string} type - success|error
     * @param {object} context - data passed to alert template
     */
    show: function(type, context, callback) {
      var type = 'form_alert_' + type;
      var html = Handlebars.partials[type](context);
      this.$el.html(html);
      return this;
    }

  });
});
