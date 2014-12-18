if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module){
  var strategies = {};

  strategies.subTotalCached = function( curr ){
    return curr + this.order.sub_total;
  };

  strategies.subTotal = function ( curr ){
    return this.order.items.reduce( function( curr, item ){

    }, curr )
  };

  return strategies;
});