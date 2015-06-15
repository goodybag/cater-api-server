/**
 * Responses
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

  return module.exports;
});