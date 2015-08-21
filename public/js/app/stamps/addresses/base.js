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
        // By default, turn all components on
        var defaults = this.components.reduce( function( obj, k ){
          obj[ k ] = true;
          return obj;
        }, {} );

        options = utils.defaults( options || {}, defaults );

        return this.components
          // Filter out components that have been disabled by user options
          .filter( function( key ){
            return !!options[ key ];
          })
          // Filter out falsey values
          .filter( function( key ){
            return !!this[ key ];
          }.bind( this ))
          // Format
          .reduce( function( list, key ){
            if ( key === 'zip' ){
              list.push( list.pop() + ' ' + this[ key ] );
            } else {
              list.push( this[ key ] );
            }

            return list;
          }.bind( this ), [] )
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