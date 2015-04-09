/**
 * Orders.DeliveryFee
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return require('stampit')()
    .compose( require('../distance/base') )
    .state({
      pricePerMile: 0
    , basePrice:    0
    })
    .enclose( function(){

    })
    .methods({
      getPrice: function(){
        return this.basePrice + Math.round( this.pricePerMile * this.miles() );
      }
    });
});