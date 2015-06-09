/**
 * GeocodeResult
 * Handles the parsing of Google Geocode Results
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var address = require('../addresses/base');
  var utils   = require('utils');

  return require('stampit')()
    .methods({
      getAddressComponent: function( component ){
        return utils.findWhere( this.address_components, function( c ){
          return c.types.indexOf( component ) > -1;
        }) || null;
      }

    , toLatLon: function(){
        return {
          x: this.geometry.location.lat
        , y: this.geometry.location.lng
        };
      }

    , toAddress: function(){
        if ( !Array.isArray( this.types ) || this.types.indexOf('street_address') === -1 ){
          throw new Error('Invalid Geocode result');
        }

        return address({
          street:   [ this.getAddressComponent('street_number').long_name
                    , this.getAddressComponent('route').long_name
                    ].join(' ')

        , street2:  (function( c ){
                      return c ? c.long_name : null;
                    })( this.getAddressComponent('subpremise') )

        , city:     this.getAddressComponent('locality').long_name

        , state:    this.getAddressComponent('administrative_area_level_1').short_name

        , zip:      this.getAddressComponent('postal_code').long_name
        });
      }
    });
});