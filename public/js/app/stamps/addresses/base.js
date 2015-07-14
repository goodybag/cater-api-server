/**
 * Addresses.Base
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  return require('stampit')()
    .state({

    })
    .enclose( function(){

    })
    .methods({
      toString: function( options ){
        var components = [
          'street', 'street2', 'city', 'state', 'zip', 'country'
        ];

        var defaults = components.reduce( function( obj, k ){
          obj[ k ] = true;
          return obj;
        }, {} );

        options = utils.defaults( options || {}, defaults );

        return components
          .filter( function( key ){
            return !!options[ key ];
          })
          .map( function( key ){
            return this[ key ];
          }.bind( this ))
          .filter( function( val ){
            return !!val;
          }.bind( this ))
          .join(', ');
      }
    });
});