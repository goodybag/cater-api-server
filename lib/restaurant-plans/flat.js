/**
 * Flat Plan
 *
 * {
 *   fee: 0.12
 * }
 */

module.exports.getPayout = function( plan, orders ){
  return orders.reduce( function( payout, order ){
    return payout + new Plans.Reduce(0)
      .set( 'order',  order )
      .set( 'plan',   plan )
      .use( OrderTotalStrategies.subTotal )
      .use( OrderTotalStrategies.adjustment )
      .use( OrderTotalStrategies.deliveryFee )
      .use( OrderTotalStrategies.tax )
      .use( OrderTotalStrategies.tip )
      .use( function( curr ){
        return curr - ( curr * this.plan.fee );
      })
      .use( Math.round )
  }, 0 );
};