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
  var utils = require('utils');

  var restaurantTotal = function( curr ){
    return curr + this.order.restaurant_total;
  };

  var payoutPlan = new utils.Plan.Reduce(0)
    .use( restaurantTotal )
    .use( function( curr ){
      return curr - ( curr * this.fee );
    })
    .use( Math.round );

  var gbFeePlan = new utils.Plan.Reduce(0)
    .use( restaurantTotal )
    .use( function( curr ){
      return curr * this.fee;
    })
    .use( Math.round );

  return {
    getPayoutForOrder: function( plan, order ){
      return payoutPlan
        .set( 'fee', plan.data.fee )
        .set( 'order', order )
        .value();
    }

  , getGbFee: function( plan, order ){
      return gbFeePlan
        .set( 'fee', plan.data.fee )
        .set( 'order', order )
        .value();
    }
  };
});