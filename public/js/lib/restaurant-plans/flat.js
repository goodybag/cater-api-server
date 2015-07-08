/**
 * Flat Plan
 *
 * {
 *   fee: 0.12
 * }
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return {
    getApplicationCut: function( plan, amount ){
      return Math.round( amount * ( plan ? plan.data.fee : 0 ) );
    }
  };
});
