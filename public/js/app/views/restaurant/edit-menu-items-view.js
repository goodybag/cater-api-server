define(function(require, exports, module) {
  var $ = require('jquery');
  var Backbone = require('backbone');

  module.exports = Backbone.View.extend({

    events: {
      'click .item-edit-show': 'showItems',
      'click .open': 'hideItems'
    },

    initialize: function() {
    },

    showItems: function(e) {
      e.preventDefault();
      this.$el.find('.items-list').show();
      this.$el.find('.item-edit-show').addClass('open').text('Hide Items');
    },

    hideItems: function(e) {
      this.$el.find('.items-list').hide();
      this.$el.find('.item-edit-show').removeClass('open').text('Show Items');
    }
  });
});