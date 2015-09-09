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
      quantity:     1
    , price:        0
    , options_sets: []
    })
    .enclose( function(){

    })
    .methods({
      getTotal: function(){
        return [
          this.getBaseCost()
        , this.getOptionsCost()
        , this.getPriorityAccountCost()
        ].reduce( utils.add, 0 ) * this.quantity;
      }

    , getBaseCost: function(){
        return this.price;
      }

    , getOptionsCost: function(){
        return utils.chain( this.options_sets )
          .pluck('options')
          .flatten()
          .filter( function( option ){
            return option.state;
          })
          .reduce( function( t, option ){
            return t + option.price;
          }, 0 )
          .value();
      }

    , getPriorityAccountCost: function(){

      }
    });
});