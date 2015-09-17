if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var PMSItem = require('../orders/payment-summary-item');
  var utils   = require('utils');

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
    });
});