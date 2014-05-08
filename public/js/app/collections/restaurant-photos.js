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
      return this;
    }
  });
});
