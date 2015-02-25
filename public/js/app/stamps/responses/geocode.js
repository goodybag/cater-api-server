/**
 * Geocode
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var config  = require('config');
  var utils   = require('utils');

  return module.exports = require('stampit')()
    .enclose( function(){
      if ( this.res ){
        this.parseResponse();
      }
    })
    .methods({
      parseResponse: function(){
        utils.extend( this, this.res[1] );
        delete this.res;
      }
    });
});