/**
 * Restaurant View
 *
 * Each of the rows on the restaurants listing
 */

define(function(require, exports, module) {

  var utils = require('utils');
  var notify = require('notify');


  return module.exports = Backbone.View.extend({

    events: {
      'click .btn-favorite': 'toggleFavorite'
    },

    initialize: function() {
    },

    toggleFavorite: function(e) {
      e.preventDefault();
      var this_ = this;
      this.model.toggleFavorite(function(err) {
        this_.$el.find('.btn-favorite').toggleClass('active');
      });
    }
  });
});
