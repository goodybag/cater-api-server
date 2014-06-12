if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var utils = require('utils');

  return [
    // Is dollar amount too low?
    function( order ){
      return order.sub_total < order.restaurant.delivery_service_order_amount_threshold;
    }

  , // Is head count too low?
    function( order ){
      return order.guests < order.restaurant.head_count_delivery_service_threshold;
    }

  , // Delivery zips
    function( order ){
      if ( order.restaurant.delivery_zips.indexOf( order.zip ) === -1 ){

      }

      return false;
    }

  , // Lead times
    function( order ){
      return false;
    }
  ];
});