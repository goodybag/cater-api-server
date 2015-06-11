/**
 * Orders.Charge
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var _ = require('lodash');

  return require('stampit')()
    .state({
      
    })
    .methods({
      getCharge: function(){

      }

    , getRestaurantCut: function(){

      }

    , getApplicationCut: function(){

      }
    });
});
