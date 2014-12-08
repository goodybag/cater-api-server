/**
 * Restaurant Plans
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return {
    flat:     require('./flat')
  , tiered:   require('./tiered')
  };
});