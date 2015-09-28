if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var PMSItem = require('../orders/payment-summary-item');
  var utils   = require('utils');
  var moment  = require('moment-timezone');

  return module.exports = require('stampit')()
    .state({
      orders: []
    })
    .methods({
      getTotalPayout: function(){
        return this.orders
          .map( PMSItem )
          .map( function( order ){
            return order.getRestaurantCut();
          })
          .reduce( utils.add, 0 );
      }

    , getItems: function(){
        return this.orders
          .map( PMSItem )
          .map( function( order ){
            return order.toPaymentSummaryItem();
          });
      }

    , getBillingPeriodFormatted: function(){
        return [
          moment( this.period_start ).format('MM/DD/YYYY')
        , moment( this.period_end ).format('MM/DD/YYYY')
        ].join(' - ');
      }
    });
});