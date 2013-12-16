define(function(require, exports, module) {
  var $ = require('jquery');
  var Backbone = require('backbone');

  module.exports = Backbone.View.extend({
    events: {
      'click .btn-change-menu': 'changeMenu'
    },

    initialize: function() {
      this.$el.find('.btn-change-menu').tooltip();
    },

    changeMenu: function(e) {
      e.preventDefault();
      var type = $(e.target).data('type');

      // Hide all categories
      this.$el.find('.menu-category').hide();

      // Show menu category type (full, group, individual)
      this.$el.find('.menu-' + type).show();
    }
  });
});