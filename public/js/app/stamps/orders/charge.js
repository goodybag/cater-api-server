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

  return require('stampit')()
    .compose( require('./base') )
    .methods({
      getRestaurantCut: function( options ){
        return [
          this.getTotalForRestaurant()
        , -this.getApplicationCut()
        ].reduce( utils.add, 0 );
      }

    , getApplicationCut: function(){
        var plan = plans[ this.restaurant.plan.type ];
        return [
          this.getTax()
        , this.type === 'courier' ? this.delivery_fee   : 0
        , this.type === 'courier' ? this.tip            : 0
        , plan.getApplicationCut(
            this.restaurant.plan, this.getTotalForPayoutCalculations()
          )
        ].reduce( utils.add, 0 );
      }
    });
});
