/**
 * Orders.Charge
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var plans = require('restaurant-plans');

  var factory = require('stampit')()
    .compose( require('./base') )
    .methods({
      getRestaurantCut: function( options ){
        return [
          this.getTotalForRestaurantCut()
        , -this.getApplicationCut()
        ].reduce( utils.add, 0 );
      }

    , getApplicationCut: function(){
        var plan = plans[ this.restaurant.plan.type ];
        return [
          this.getTax()
        , this.getPriorityAccountCost()
        , this.type === 'courier' ? this.delivery_fee   : 0
        , this.type === 'courier' ? this.tip            : 0
        , plan.getApplicationCut(
            this.restaurant.plan, this.getTotalForPayoutCalculations()
          )
        , this.service_fee
        ].reduce( utils.add, 0 );
      }

      /**
       * When calculating the total for payout calculations,
       * we need to ignore user adjustments. In addition, if the
       * type of order is `courier`, do not factor in delivery/tip
       * @return {Number} The total
       */
    , getTotalForPayoutCalculations: function(){
        var nonPriorityModel = factory( utils.deepExtend( {}, this ) );
        
        nonPriorityModel.priority_account_price_hike_percentage = 0;

        return [
          this.getSubTotal()
        , this.adjustment_amount
        , nonPriorityModel.getTax()
        , this.type === 'courier' ? 0 : this.delivery_fee
        , this.type === 'courier' ? 0 : this.tip
        ].reduce( utils.add, 0 );
      }

      /**
       * When calculating the total for payout calculations,
       * we need to ignore user adjustments.
       * @return {Number} The total
       */
    , getTotalForRestaurantCut: function(){
        return [
          this.getSubTotal()
        , this.adjustment_amount
        , this.getTax()
        , this.getPriorityAccountCost()
        , this.delivery_fee
        , this.tip
        , this.service_fee
        ].reduce( utils.add, 0 );
      }
    });

  return factory;
});
