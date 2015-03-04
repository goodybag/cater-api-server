/**
 * User-invoice
 */

if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var stampit = require('stampit');
  var usd     = require('usd');

  return module.exports = stampit()
    .state({
      orders: []
    })
    .methods({
      total: function(){
        console.log('total',this);
        var total = this.orders.reduce( function( curr, order ){
          return curr + order.total;
        }, 0 );

        return usd().pennies( total );
      }
    });
});