/**
 * Note: Paging is by collection _index_ not photo _id_
 * because the photo ids are not necessarily in order!
 */
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

  , setCurrent: function(idx) {
      this.currentIdx = idx;
      return this.getCurrent();
    }

  , getCurrent: function() {
      return this.at(this.currentIdx);
    }

  , next: function() {
      this.setCurrent( (this.currentIdx + 1) % this.length );
      return this.getCurrent();
    }

  , prev: function() {
      this.setCurrent( (this.currentIdx - 1) % this.length );
      return this.getCurrent();
    }

  , comparator: 'priority'
  });
});
