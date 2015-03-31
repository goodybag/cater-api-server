define(function(require, exports, module) {
  var $ = require('jquery');
  var Backbone = require('backbone');

  module.exports = Backbone.View.extend({
    events: {
      'click .item-edit-show': 'show'
    },

    initialize: function() {
    },

    show: function(e) {
      e.preventDefault();
      this.console.log('hi');
      // var type = $(e.target).data('type');

      // // Hide all categories
      // this.$el.find('.menu-category').hide();

      // // Show menu category type (full, group, individual)
      // this.$el.find('.menu-' + type).show();
    }
  });
});