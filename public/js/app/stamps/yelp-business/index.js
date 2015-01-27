/**
 * Yelp Business
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var stampit = require('stampit');
  var utils   = require('utils');

  module.exports = stampit();

  var stamps = {
    coercions:  require('./coercions')
  , fetch:      require('./fetch')
  };

  module.exports = module.exports.compose.apply(
    module.exports
  , utils.values( stamps );
  );

  utils.extend( module.exports, stamps );

  return module.exports;
});