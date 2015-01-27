/**
 * Restaurant
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var stampit = require('stampit');

  module.exports = stampit();

  var stamps = {
    gleaning: require('./gleaning')
  };

  module.exports = module.exports.compose.apply(
    module.exports
  , utils.values( stamps );
  );

  utils.extend( module.exports, stamps );

  return module.exports;
});