/**
 * Order
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var OrderTotalStrategies = require('../../../lib/order-total-strategies');
  var BasePlan = new utils.Plan.Reduce(0)
      .use( OrderTotalStrategies.subTotal )
      .use( OrderTotalStrategies.adjustment );

  var plans = {
    userTotal: BasePlan.clone()
      .use( OrderTotalStrategies.userAdjustment )
      .use( OrderTotalStrategies.deliveryFee )
      .use( OrderTotalStrategies.tax )
      .use( OrderTotalStrategies.tip )
      .use( Math.round )

  , restaurantTotal: BasePlan.clone()
      .use( OrderTotalStrategies.deliveryFee )
      .use( OrderTotalStrategies.tax )
      .use( OrderTotalStrategies.tip )
      .use( Math.round )

  , userSalesTax: BasePlan.clone()
      .use( OrderTotalStrategies.userAdjustment )
      .use( OrderTotalStrategies.deliveryFee )
      .use( function( curr ){
        if ( !this.restaurant ) return 0;
        return curr * this.restaurant.sales_tax;
      })
      .use( Math.round )

  , restaurantSalesTax: BasePlan.clone()
      .use( OrderTotalStrategies.userAdjustment )
      .use( OrderTotalStrategies.deliveryFee )
      .use( function( curr ){
        if ( !this.restaurant ) return 0;
        return curr * this.restaurant.sales_tax;
      })
      .use( Math.round )
  };

  var restaurantTotalPlan = ;

  var userSalesTaxPlan = ;

  module.exports.create = function( order ){
    var def = {
      get total (){
        return userTotalPlan
          .set( 'order', this )
          .value();
      }
    , get restaurant_total (){
        return restaurantTotalPlan
          .set( 'order', this )
          .value();
      }
    , get user_sales_tax (){
        return usersSalesTaxPlan
          .set( 'order', this )
          .value();
      }
    , get restaurant_sales_tax (){
        return restaurantSalesTaxPlan
          .set( 'order', this )
          .value();
      }
    };

    for ( var key in order ){
      def[ key ] = order[ key ];
    }

    return Object.create( def );
  };
});