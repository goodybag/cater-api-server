/**
 * Distance.Base
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var METERS_IN_A_MILE = 1609.34;

  return require('stampit')()
    .state({
      meters: 0
    })
    .enclose( function(){

    })
    .methods({
      miles: function( value ){
        if ( [ undefined, null ].indexOf( value ) > -1 ){
          return this.meters / METERS_IN_A_MILE;
        }

        this.meters = value * METERS_IN_A_MILE;

        return this;
      }
    });
});