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
  var Orders = require('stamps/orders/base');

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
    return curr - this.order.getSalesTax();
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
  }

  var payoutPlan = new utils.Plan.Reduce(0)
    .use( addOrderTotal )
    .use( subtractSalesTax )
    .use( subtractFlatFee )
    .use( Math.round );

  var appFeePlan = new utils.Plan.Reduce(0)
    .use( addOrderTotal )
    .use( subtractUserAdjustments )
    .use( applyFlatFee )
    .use( Math.round );

  return {
    getPayoutForOrder: function( plan, order ){
      console.warn('plan.getPayoutForOrder is being deprecated as it goes beyond the scope of plans. Use order model logic instead.');
      return payoutPlan
        .set( 'fee', plan.data.fee )
        .set( 'order', Orders( order ) )
        .value();
    }

    // Just an alias for `getApplicationFee` for legacy reasons
  , getGbFee: function( plan, order ){
      console.warn('plan.getGbFee is being deprecated. Use plan.getApplicationCut');
      return appFeePlan
        .set( 'fee', plan ? plan.data.fee : 0 )
        .set( 'order', Orders( order ) )
        .value();
    }

  , getApplicationCut: function( plan, order ){
      // return the application fee we take out of every charge
      // on behalf of the managed accounts (restaurants).
      // https://stripe.com/docs/connect/payments-fees#collecting-fees
      return appFeePlan
        .set( 'fee', plan ? plan.data.fee : 0 )
        .set( 'order', Orders( order ) )
        .value();
    }
  };
});
