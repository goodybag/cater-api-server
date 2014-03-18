define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.Model.extend({
    toggleFavorite: function(cb) {
      var favorite = this.get('favorite');
      this.sync(favorite ? 'delete' : 'create', this, {
        success: cb
      , error: function() { alert('x'); }
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
