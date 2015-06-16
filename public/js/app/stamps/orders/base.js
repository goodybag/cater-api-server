/**
 * Orders.Base
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var items = require('./item');
  var amenities = require('./amenity');

  return require('stampit')()
    .state({
      items: []
    , amenities: []
    , adjustment: 0
    , userAdjustment: 0
    })
    .methods({
      getTax: function(){
        var amount = this.getSubTotal() + this.adjustment + this.userAdjustment;
        return Math.ceil( amount * this.region.sales_tax );
      }

    , getAmenityTotal: function() {
        return this.amenities.reduce( function( total, amenity ){
          return total + amenities( amenity ).getTotal();
        }, 0 );
      }

    , getSubTotal: function(){
        return this.items.reduce( function( total, item ){
          return total + items( item ).getTotal();
        }, 0 );
      }

    , getTotal: function(){
        return [
          this.getSubTotal()
        , this.getAmenityTotal()
        , this.adjustment
        , this.userAdjustment
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 )
      }

    , getRestaurantTotal: function(){
        return [
          this.getSubTotal()
        , this.getAmenityTotal()
        , this.adjustment
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 )
      }
    });
});
