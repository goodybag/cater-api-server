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
      _pricePerMile: 0
    })
    .enclose( function(){

    })
    .methods({
      pricePerMile: function( value ){
        if ( [ undefined, null ].indexOf( value ) > -1 ) return this._pricePerMile;
        this._pricePerMile = value;
        return this;
      }

    , price: function(){
        return Math.round( this.pricePerMile() * this.miles() );
      }
    });
});