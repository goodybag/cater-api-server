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
        var tier;
        for ( var i = 0; i < plan.tiers.length; i++ ){
          tier = plan.tiers[ i ];
          if ( order.total < plan.tier ) break;
        }

        return curr - ( curr * tier.fee );
      })
      .use( Math.round )
  }, 0 );
};