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

  var restaurantPlanTierFee = function( curr ){
    return curr - ( curr * this.tier.fee );
  };

  var restaurantSalesTax = function( curr ){
    return curr - (this.order.restaurant_sales_tax || 0);
  };

  var applyTierFee = function( curr ){
    return curr * this.tier.fee;
  };

  var addSalesTax = function( curr ){
    return curr += this.order.restaurant_sales_tax || 0;
  };

  var addCourierFees = function( curr ){
    if ( this.order.type !== 'courier' ) return curr;
    curr += this.order.delivery_fee || 0;
    curr += this.order.tip || 0;
    return curr;
  };

  var payoutPlan = new utils.Plan.Reduce(0)
    .use( restaurantTotal )
    .use( restaurantPlanTierFee )
    .use( restaurantSalesTax )
    .use( Math.round );

  var gbFeePlan = new utils.Plan.Reduce(0)
    .use( restaurantTotal )
    .use( function( curr ){
      return curr * this.tier.fee;
    })
    .use( Math.round );

  var appFeePlan = new utils.Plan.Reduce(0)
    .use( restaurantTotal )
    .use( applyTierFee )
    .use( addSalesTax )
    .use( addCourierFees )
    .use( Math.round );

  return Object.create({
    getPayoutForOrder: function( plan, order ){
      return payoutPlan
        .set( 'tier', this.getTier( plan, order ) )
        .set( 'order', order )
        .value();
    }

  , getTier: function( plan, order ){
      if ( !plan ) return { fee: 0 };
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

  , getApplicationFee: function( plan, order ){
      // return the application fee we take out of every charge
      // on behalf of the managed accounts (restaurants).
      // https://stripe.com/docs/connect/payments-fees#collecting-fees
      return appFeePlan
        .set( 'tier', this.getTier( plan, order ) )
        .set( 'order', order )
        .value();
    }
  });
});
