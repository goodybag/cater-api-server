/**
 * Flat Plan
 *
 * {
 *   fee: 0.12
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
      return Math.round( order.restaurant_total - ( order.restaurant_total * plan.data.fee ) );
    }
  };
});