/**
 * Orders.Item
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  return require('stampit')()
    .state({
      quantity:     0
    , price:        0
    , options_sets: []
    })
    .enclose( function(){

    })
    .methods({
      getPrice: function(){
        var options = utils.chain( this.options_sets )
          .pluck('options')
          .flatten()
          .filter( function( option ){
            return option.state;
          })
          .reduce( function( t, option ){
            return t + option.price;
          }, 0 )
          .value();

        return ( this.price + options ) * this.quantity;
      }
    });
});