/**
 * Tiered Plan
 *
 * {
 *   tiers: [
 *     { amount: 50000, fee: 0.12 }
 *   , { amount: 100000, fee: 0.13 }
 *   , { amount: 200000, fee: 0.14 }
 *   ...
 *   ]
 * }
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return {
    getPayoutForOrder: function( plan, order ){
      var tier, i;
      for ( i = 0; i < plan.data.tiers.length; i++ ){
        tier = plan.data.tiers[ i ];
        if ( order.restaurant_total < tier.amount ) break;
      }

      return Math.round( order.restaurant_total - ( order.restaurant_total * tier.fee ) );
    }
  };
});