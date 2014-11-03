define(function(require, exports, module) {
  var utils               = require('utils');
  var RestaurantLocation  = require('../models/restaurant-location');

  return module.exports = utils.Collection.extend({
    model: RestaurantLocation

  , url: function(){
      return [
        '/api/restaurants/'
      , this.restaurant_id
      , '/locations'
      ].join('');
    }

  , initialize: function( models, options ){
      utils.enforceRequired( options || {}, [
        'restaurant_id'
      ]);

      this.restaurant_id = options.restaurant_id;

      return this;
    }

  , _prepareModel: function( attrs, options ){
      if ( attrs instanceof utils.Model ) return attrs;

      attrs = attrs || {};
      options = options || {};

      // Always set payment_summary_id/sales_tax on new models
      attrs.restaurant_id = this.restaurant_id;

      return utils.Collection.prototype._prepareModel.call( this, attrs, options );
    }
  });
});