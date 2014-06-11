if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
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
      return false;
    }

  , // Lead times
    function( order ){
      return false;
    }
  ];
});