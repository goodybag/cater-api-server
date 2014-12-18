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
  var utils = require('utils');

  var restaurantTotal = function( curr ){
    return curr + this.order.restaurant_total;
  };

  var payoutPlan = new utils.Plan.Reduce(0)
    .use( restaurantTotal )
    .use( function( curr ){
      return curr - ( curr * this.tier.fee );
    })
    .use( Math.round );

  var gbFeePlan = new utils.Plan.Reduce(0)
    .use( restaurantTotal )
    .use( function( curr ){
      return curr * this.tier.fee;
    })
    .use( Math.round );

  return Object.create({
    getPayoutForOrder: function( plan, order ){
      return payoutPlan
        .set( 'tier', this.getTier( plan, order ) )
        .set( 'order', order )
        .value();
    }

  , getTier: function( plan, order ){
      var i;
      for ( i = 0; i < plan.data.tiers.length - 1; i++ ){
        if ( order.restaurant_total < plan.data.tiers[ i ].amount ) break;
      }

      return plan.data.tiers[ i ];
    }

  , getGbFee: function( plan, order ){
      return gbFeePlan
        .set( 'tier', this.getTier( plan, order ) )
        .set( 'order', order )
        .value();
    }
  });
});