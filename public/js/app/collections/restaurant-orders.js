define(function(require, exports, module) {
  var utils  = require('utils');
  var Order  = require('../models/order');

  return module.exports = utils.Collection.extend({
    model: Order

  , url: function(){
      return [
        '/api/restaurants/'
      , this.restaurant_id
      , '/orders'
      ].join('');
    }

  , initialize: function( models, options ){
      this.restaurant_id = options.restaurant_id;
      return this;
    }
  });
});
