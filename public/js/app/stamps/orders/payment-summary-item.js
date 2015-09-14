/**
 * Orders.Item
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return require('stampit')()
    .compose( require('./base') )
    .state({

    })
    .methods({
      toPaymentSummaryItem: function(){

      }
    });
});