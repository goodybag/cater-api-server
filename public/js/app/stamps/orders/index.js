/**
 * Orders
 */

if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var stampit = require('stampit');
  var utils   = require('utils');

  module.exports = stampit();

  var stamps = {
    base: require('./base')
  , deliveryFee: require('./delivery-fee')
  };

  module.exports = module.exports.compose.apply(
    module.exports
  , utils.values( stamps )
  );

  utils.extend( module.exports, stamps );

  module.exports.item = require('./item');
  module.exports.amenity = require('./amenity');
  module.exports.Cached = stamps.base.Cached;

  return module.exports;
});
