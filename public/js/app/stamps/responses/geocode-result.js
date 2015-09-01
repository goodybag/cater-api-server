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

  var gResult = require('stampit')()
    .methods({
      getAddressComponent: function( component ){
        return utils.findWhere( this.address_components, function( c ){
          return c.types.indexOf( component ) > -1;
        }) || null;
      }

    , toLatLng: function(){
        return {
          x: this.geometry.location.lat
        , y: this.geometry.location.lng
        };
      }

    , isValid: function(){
        return [
          function( res ){
            return Array.isArray( res.types );
          }

        , function( res ){
            return gResult.acceptableTypes.some( function( t ){
              return res.types.indexOf( t ) > -1;
            });
          }

        , function( res ){
            return res.geometry && res.geometry.location && res.geometry.location.lat;
          }
        ].every( function( fn ){
          return fn( this );
        }.bind( this ));
      }

    , toAddress: function(){
        if ( !this.isValid() ){
          throw new Error('Invalid Geocode Result');
        }
        
        var a = address({
          street:   [ this.getAddressComponent('street_number').long_name
                    , this.getAddressComponent('route').long_name
                    ].join(' ')

        , street2:  (function( c ){
                      return c ? c.long_name : null;
                    })( this.getAddressComponent('subpremise') )

        , city:     this.getAddressComponent('locality').long_name

        , state:    this.getAddressComponent('administrative_area_level_1').short_name

        , zip:      this.getAddressComponent('postal_code').long_name

        , lat_lng:  this.toLatLng()
        });

        if ( a.street2 === null ){
          delete a.street2;
        }

        return a;
      }
    });

  gResult.acceptableTypes = [
  , 'premise'
  , 'subpremise'
  , 'airport'
  , 'park'
  , 'street_address'
  ];

  return gResult;
});