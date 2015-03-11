/**
 * User-invoice
 */
if ( typeof module === 'object' && module && typeof module.exports === 'object' ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var stampit = require('stampit');
  var Promise = require('bluebird');
  var utils   = require('utils');

  module.exports = stampit();

  var stamps = {
    autoPopulate: require('./auto-populate')
  , base:         require('./base')
  , email:        require('./email')
  , db:           require('./db')
  };

  module.exports = module.exports.compose.apply(
    module.exports
  , utils.values( stamps )
  );

  utils.extend( module.exports, stamps );

  Promise.promisifyAll( module.exports.fixed.methods );

  return module.exports;
});