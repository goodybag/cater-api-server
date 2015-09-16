/**
 * Orders.PaymentSummaryItem
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  module.exports = require('stampit')()
    .compose( require('./base') )
    .compose( require('./charge') )
    .state({

    })
    .methods({
      toPaymentSummaryItem: function(){
        var result = {
          total:        this.getTotal()
        , delivery_fee: this.type === 'courier' ? -this.delivery_fee : 0
        , tip:          this.type === 'courier' ? -this.tip : 0
        , gb_fee:      -this.getApplicationCut()
        , sales_tax:   -this.getTax()
        , net_payout:   this.getRestaurantCut()
        };

        // Application Cut includes these things
        result.gb_fee -= result.sales_tax;
        result.gb_fee -= result.delivery_fee;
        result.gb_fee -= result.tip;

        return result;
      }
    });

  module.exports.requiredOrderQueryOptions = {
    many: [ { table: 'order_items', alias: 'items' }
          , { table: 'order_amenities', alias: 'amenities', mixin: [ { table: 'amenities' } ] }
          ]
  , one:  [ { table: 'users', alias: 'user' }
          , { table: 'delivery_services', alias: 'deliveryService' }
          , { table: 'restaurant_locations', alias: 'location' }
          ]
  };

  return module.exports;
});