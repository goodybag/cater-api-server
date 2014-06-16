define(function(require, exports, module) {
  var utils  = require('utils');
  var RestaurantPhoto  = require('../models/restaurant-photo');

  return module.exports = utils.Collection.extend({
    model: RestaurantPhoto

  , url: function(){
      return [
        '/api/restaurants/'
      , this.restaurant_id
      , '/photos'
      ].join('');
    }

  , initialize: function( models, options ){
      this.restaurant_id = options.restaurant_id;
      this.setCurrent(0);
      return this;
    }

  , setCurrent: function(id) {
      this.currentId = id;
    }

  , getCurrent: function() {
      return this.get(this.currentId);
    }

  , next: function() {

    }

  , prev: function() {

    }

  , comparator: 'priority'
  });
});
