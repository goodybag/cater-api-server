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

var Plan = require('plan.js');
var OrderTotalStrategies = require('../../public/js/lib/order-total-strategies');

var payoutPlan = new Plans.Reduce(0)
  .use( OrderTotalStrategies.subTotal )
  .use( OrderTotalStrategies.adjustment )
  .use( OrderTotalStrategies.deliveryFee )
  .use( OrderTotalStrategies.tax )
  .use( OrderTotalStrategies.tip )
  .use( function( curr ){
    var tier;
    for ( var i = 0; i < this.plan.tiers.length; i++ ){
      tier = this.plan.tiers[ i ];
      if ( order.total < this.plan.tier ) break;
    }

    return curr - ( curr * tier.fee );
  })
  .use( Math.round );

module.exports.getPayoutForOrder = function( plan, order ){
  return payoutPlan
    .set( 'order',  order )
    .set( 'plan',   plan )
    .value();
};