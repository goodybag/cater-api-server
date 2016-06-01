/**
 * Orders.DeliveryFee
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var fulfillability = require('./fulfillability');

  return require('stampit')()
    .compose( require('../distance/base') )
    .state({
      pricePerMile: 0
    , basePrice:    0
    , waive_delivery_fee: false
    })
    .enclose( function(){

    })
    .methods({
      getPrice: function(){
        if ( this.waive_delivery_fee ){
          return 0;
        }

        return this.basePrice + Math.round( this.pricePerMile * this.miles() );
      }

      /**
       * Gets the zip-based delivery fee range (min->max) based
       * on a restaurant (if provided)
       * @param  {[type]} restaurant [description]
       * @return {[type]}            [description]
       */
    , getZipBasedRange: function( restaurant ){
        var order = fulfillability( this );

        if ( restaurant ){
          order.restaurant = restaurant;
        }

        var fees = utils.pluck( order.getAllSupportedDeliveryZips(), 'fee' );

        return {
          min: ~~Math.min.apply( null, fees )
        , max: ~~Math.max.apply( null, fees )
        };
      }
    });
});
