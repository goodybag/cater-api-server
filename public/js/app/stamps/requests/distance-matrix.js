/**
 * Distance Matrix
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var config  = require('config');
  var utils   = require('utils');
  var base    = require('./base');
  var GeoRes  = require('../responses/geocode');

  return module.exports = require('stampit')()
    .compose( base )
    .enclose( function(){
      this.json();
      this.url( config.google.distanceMatrix.url );
      this.query( 'key', config.google.apiKey );
    })
    .methods({
      origin: function( originAddress ){

      }

    , destination: function( destinationAddress ){

      }
    });
});