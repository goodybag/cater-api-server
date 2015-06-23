/**
 * AddressString
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils   = require('utils');
  var api     = require('api');
  var Address = require('./address');

  return utils.Model.extend({
    geocode: function( callback ){
      api.maps.geocode( this.get('address'), function( error, result ){
        if ( error ){
          return callback( error );
        }

        // Copy over fields that aren't in the geocoded version
        ['street2', 'name', 'delivery_instructions'
        ].forEach( function( k ){
          if ( !this.get( k ) ) return;

          result.address[ k ] = this.get( k );
        });

        return callback( null, new Address( result.address ) );
      }.bind( this ));
    }
  });
});