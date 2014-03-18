/**
 * Restaurant Favorites View
 *
 * Filters restaurants listing by user favorites
 */

define(function(require, exports, module) {

  var utils = require('utils');
  var notify = require('notify');

  return module.exports = Backbone.View.extend({

    events: {
      'click .btn-favorite': 'toggle'
    },

    initialize: function() {
    },

    toggle: function(e) {
      e.preventDefault();
      var this_ = this;
      this_.$el.find('.btn-favorite').toggleClass('active');
      this.trigger('favorites:change');
    },

    getProps: function() {
      return {
        favorites: this.$el.find('.btn-favorite').hasClass('active')
      };
    }
  });
});
