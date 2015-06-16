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
    return curr + this.order.getTotal({ restaurant: true });
  };

  var subtractUserAdjustments = function( curr ){
    return curr - (this.order.userAdjustment || 0);
  };

  var subtractSalesTax = function( curr ){
    return curr - this.order.getTax();
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

  var applyFee = function( curr ){
    return curr * this.tier.fee;
  };

  var appFeePlan = new utils.Plan.Reduce(0)
    .use( addOrderTotal )
    .use( subtractCourierFees )
    .use( applyFee )
    .use( Math.ceil );

  return Object.create({
    getTier: function( plan, order ){
      if ( !plan ) return { fee: 0 };
      var i;
      var total = order.getTotal();
      for ( i = 0; i < plan.data.tiers.length - 1; i++ ){
        if ( total < plan.data.tiers[ i ].amount ) break;
      }

      return plan.data.tiers[ i ];
    }

  , getApplicationCut: function( plan, order ){
      order = Orders( order );

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
