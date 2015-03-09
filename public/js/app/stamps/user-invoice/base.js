/**
 * User-invoice
 */

if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var stampit   = require('stampit');
  var billingP  = require('../datetime/billing-period');
  var usd       = require('usd');

  return module.exports = stampit()
    .state({
      orders: []
    })
    .methods({
      total: function(){
        var total = this.orders.reduce( function( curr, order ){
          return curr + order.total;
        }, 0 );

        return usd().pennies( total );
      }

    , billing: function( period ){
        if ( period ){
          period = billingP( period );
          this.billing_period_start = period.startDate;
          this.billing_period_end = period.endDate;
          return this;
        }

        return billingP({
          startDate: this.billing_period_start
        , endDate: this.billing_period_end
        });
      }
    });
});