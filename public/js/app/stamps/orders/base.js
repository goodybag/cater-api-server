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
    , adjustment_amount: 0
    , user_adjustment_amount: 0
    , guests: 0
    , delivery_fee: 4
    , payment_method_id: null
    })
    .methods({
      getTax: function(){
        if ( this.user && this.user.is_tax_exempt ){
          return 0;
        }

        var amount = this.getSubTotal() + this.adjustment_amount + this.user_adjustment_amount + this.delivery_fee;
        return Math.round( amount * this.restaurant.region.sales_tax );
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

    , getNoContractFee: function(){
        if ( this.restaurant.plan ) return 0;
        return Math.round(this.getTotalForContractFee() * this.restaurant.no_contract_fee);
      }

    , getTotalForContractFee: function() {
        return [
          this.getSubTotal()
        , this.adjustment_amount
        , this.user_adjustment_amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 );
      }

    , getTotal: function( options ){
        return [
          this.getSubTotal()
        , this.adjustment_amount
        , this.user_adjustment_amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        , this.getNoContractFee()
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
        , this.adjustment_amount
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
        , this.adjustment_amount
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
        , this.adjustment_amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 );
      }
    });
});
