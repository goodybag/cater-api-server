/**
 * Addresses.Base
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return require('stampit')()
    .state({

    })
    .enclose( function(){

    })
    .methods({
      toString: function(){
        return [
          'street', 'street2', 'city', 'state', 'zip', 'country'
        ].map( function( key ){
          return this[ key ];
        }.bind( this ))
        .filter( function( val ){
          return !!val;
        }.bind( this ))
        .join(', ');
      }
    });
});