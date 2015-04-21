/**
 * Admin Panel - Restaurant Notes
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var $                   = require('jquery-loaded');
  var Hbs                 = require('handlebars');
  var utils               = require('utils');
  var config              = require('config');
  var spinner             = require('spinner');
  var RestaurantNote      = require('app/models/restaurant-note');

  module.exports = utils.View.extend({
    events: {
      'submit form': 'onSubmit'
    },

    initialize: function() {
      this.$note = this.$el.find('form .input-note');
      this.$tbody = this.$el.find('tbody');
    },

    onSubmit: function(e) {
      e.preventDefault();
      this.insertNote();
    },

    insertNote: function() {
      var note = new RestaurantNote({
        note: this.$note.val()
      , restaurant_id: this.options.restaurant_id
      , user_id: this.options.user_id
      });

      note.save(null, {
        success: function() {
          window.location.reload();
        },
        error: this.options.alertView.show.bind(this.options.alertView, 'error')
      });
    }
  });

  return module.exports;
});
