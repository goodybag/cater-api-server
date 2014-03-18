/**
 * Interface to set a user's favorite restaurant
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.Model.extend({
    toggleFavorite: function(cb) {
      var favorite = this.get('favorite');
      this.sync(favorite ? 'delete' : 'create', this, {
        success: cb.bind(undefined, null, this)
      , error: cb.bind(undefined, 'unable to toggle')
      });
      this.set('favorite', !favorite);
    },

    url: function() {
      return [
        '/api/users/'
      , this.get('userId')
      , '/favorites/restaurants/'
      , this.get('restaurantId')
      ].join('');
    }
  });
});
