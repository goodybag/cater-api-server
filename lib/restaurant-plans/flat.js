/**
 * Flat Plan
 *
 * {
 *   fee: 0.12
 * }
 */


var payoutPlan = new Plans.Reduce(0)
  .use( OrderTotalStrategies.subTotal )
  .use( OrderTotalStrategies.adjustment )
  .use( OrderTotalStrategies.deliveryFee )
  .use( OrderTotalStrategies.tax )
  .use( OrderTotalStrategies.tip )
  .use( function( curr ){
    return curr - ( curr * this.plan.fee );
  })
  .use( Math.round );

module.exports.getPayoutForOrder = function( plan, order ){
  return payoutPlan
    .set( 'plan', plan )
    .set( 'order', order )
    .value();
};