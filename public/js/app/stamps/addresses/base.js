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
      components: [
        'street', 'street2', 'city', 'state', 'zip', 'country'
      ]

    , minimumComponents: [
        'street', 'city', 'state', 'zip'
      ]

    , toString: function( options ){
        var defaults = this.components.reduce( function( obj, k ){
          obj[ k ] = true;
          return obj;
        }, {} );

        options = utils.defaults( options || {}, defaults );

        return this.components
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

      /**
       * Returns whether or not the instance has all of the minimum
       * components required to be a valid adddress
       * @return {Boolean}
       */
    , hasMinimumComponents: function(){
        return this.minimumComponents.every( function( k ){
          return typeof this[ k ] === 'string' && this[ k ].length > 0;
        }.bind( this ));
      }

      /**
       * Returns a list of address components that this instance possesses
       * @return {String[]} 
       */
    , fulfilledComponents: function(){
        return this.components
          .filter( function( k ){
            return k in this;
          }.bind( this ))
      }
    });
});