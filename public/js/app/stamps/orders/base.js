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
    , user_adjustment: { amount: 0, description: '' }
    , guests: 0
    })
    .methods({
      getTax: function(){
        var amount = this.getSubTotal() + this.adjustment.amount + this.user_adjustment.amount;
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
        return [
          this.getSubTotal()
        , this.adjustment.amount
        , this.user_adjustment.amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 );
      }

      /**
       * When calculating the total for payout calculations,
       * we need to ignore user adjustments. In addition, if the
       * type of order is `courier`, do not factor in delivery/tip
       * @return {Number} The total
       */
    , getTotalForPayoutCalculations: function(){
        return [
          this.getSubTotal()
        , this.adjustment.amount
        , this.getTax()
        , this.type === 'courier' ? 0 : this.delivery_fee
        , this.type === 'courier' ? 0 : this.tip
        ].reduce( utils.add, 0 );
      }

      /**
       * When calculating the total for payout calculations,
       * we need to ignore user adjustments.
       * @return {Number} The total
       */
    , getTotalForRestaurant: function(){
        return [
          this.getSubTotal()
        , this.adjustment.amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 );
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
