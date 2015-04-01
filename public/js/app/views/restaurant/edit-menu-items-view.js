define(function(require, exports, module) {
  var $ = require('jquery');
  var Backbone = require('backbone');

  module.exports = Backbone.View.extend({
    events: {
      'click .item-edit-show': 'show',
      'click .open': 'hide'
    },

    initialize: function(category) {
    },

    show: function(e) {
      e.preventDefault();
      this.$el.find('.items-list').show();
      this.$el.find('.item-edit-show').addClass('open').text('Hide Items');
    },

    hide: function(e) {
      e.preventDefault();
      this.$el.find('.items-list').hide();
      this.$el.find('.item-edit-show').removeClass('open').text('Show Items');
    }
  });
});