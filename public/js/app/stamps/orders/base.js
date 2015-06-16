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
    , adjustment: { amount: 0, description: '' }
    , userAdjustment: { amount: 0, description: '' }
    , guests: 0
    })
    .methods({
      getTax: function(){
        var amount = this.getSubTotal() + this.adjustment.amount + this.userAdjustment.amount;
        return Math.ceil( amount * this.region.sales_tax );
      }

    , getAmenityTotal: function() {
        return this.amenities.reduce( function( total, amenity ){
          amenity.guests = this.guests; // mixin guests to amenity
          return total + amenities( amenity ).getTotal();
        }.bind(this), 0 );
      }

    , getItemTotal: function(){
        return this.items.reduce( function( total, item ){
          return total + items( item ).getTotal();
        }, 0 );
      }

    , getTotal: function( options ){
        options = utils.defaults( options || {}, {
          restaurant: false
        });

        return [
          this.getSubTotal()
        , this.adjustment.amount
        , options.restaurant ? 0 : this.userAdjustment.amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 )
      }

    , getSubTotal: function(){
        return [
          this.getItemTotal()
        , this.getAmenityTotal()
        ].reduce( utils.add, 0 );
      }

    , getRestaurantTotal: function(){
        return [
          this.getSubTotal()
        , this.adjustment.amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 )
      }
    });
});
