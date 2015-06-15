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
  var Orders = require('stamps/orders/base')

  var addOrderTotal = function( curr ){
    return curr + this.order.getTotal();
  };

  var subtractUserAdjustments = function( curr ){
    return curr - (this.order.user_adjustment || 0);
  };

  var subtractFlatFee = function( curr ){
    return curr - ( curr * this.fee );
  };

  var subtractSalesTax = function( curr ){
    return curr - this.order.getTax();
  };

  var applyFlatFee = function( curr ){
    return curr * this.fee;
  };

  var addCourierFees = function( curr ){
    if ( this.order.type !== 'courier' ) return curr;
    curr += this.order.delivery_fee || 0;
    curr += this.order.tip || 0;
    return curr;
  };

  var subtractCourierFees = function( curr ){
    if ( this.order.type !== 'courier' ) return curr;
    return curr - (this.order.delivery_fee + this.order.tip);
  };

  var subtractFee = function( curr ){
    return curr - ( curr * this.tier.fee );
  };

  var restaurantSalesTax = function( curr ){
    return curr - (this.order.restaurant_sales_tax || 0);
  };

  var applyFee = function( curr ){
    return curr * this.tier.fee;
  };

  var payoutPlan = new utils.Plan.Reduce(0)
    .use( addOrderTotal )
    .use( subtractSalesTax )
    .use( subtractFee )
    .use( Math.round );

  var appFeePlan = new utils.Plan.Reduce(0)
    .use( addOrderTotal )
    .use( subtractUserAdjustments )
    .use( applyFlatFee )
    .use( Math.round );

  return Object.create({
    getPayoutForOrder: function( plan, order ){
      console.warn('plan.getPayoutForOrder is deprecated as it goes beyond the scope of plans. Use order model logic instead.');

      return payoutPlan
        .set( 'tier', this.getTier( plan, order ) )
        .set( 'order', Orders( order ) )
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
      console.warn('plan.getGbFee is deprecated. Use plan.getApplicationCut');

      return appFeePlan
        .set( 'tier', this.getTier( plan, order ) )
        .set( 'order', Orders( order ) )
        .value();
    }

  , getApplicationFee: function( plan, order ){
      // return the application fee we take out of every charge
      // on behalf of the managed accounts (restaurants).
      // https://stripe.com/docs/connect/payments-fees#collecting-fees
      return appFeePlan
        .set( 'tier', this.getTier( plan, order ) )
        .set( 'order', Orders( order ) )
        .value();
    }
  });
});
