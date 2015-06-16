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
    return curr + this.order.getTotal({ restaurant: true });
  };

  var applyFlatFee = function( curr ){
    return curr * this.fee;
  };

  var subtractCourierFees = function( curr ){
    if ( this.order.type !== 'courier' ) return curr;
    return curr - (this.order.delivery_fee + this.order.tip);
  };

  var appFeePlan = new utils.Plan.Reduce(0)
    .use( addOrderTotal )
    .use( subtractCourierFees )
    .use( applyFlatFee )
    .use( Math.ceil );

  return {
    getApplicationCut: function( plan, order ){
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
