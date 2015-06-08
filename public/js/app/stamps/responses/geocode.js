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
      if ( !this.res ){
        throw new Error('Must provide `res`');
      }

      if ( !this.requestAddress ){
        throw new Error('Must provide original address `requestAddress`');
      }

      this.parseResponse();
    })
    .methods({
      parseResponse: function(){
        utils.extend( this, this.res[1] );
        delete this.res;
      }

    , isValidAddress: function(){
        return [
          function(){
            return this.status === 'OK';
          }

        , function(){
            return this.results.filter( function( result ){
              return result.types.indexOf('street_address') > -1;
            }).length > 0;
          }

        // TODO compare tokens for similarity
        // , function(){
        //     return this.results.filter( function( result ){
        //       return result.types.indexOf('street_address') > -1;
        //     }).some( function( result ){
        //       return this.requestAddress
        //     });
        //   }
        ].reduce( function( isValid, fn ){
          if ( !isValid ) return false;

          return isValid && fn.call( this );
        }.bind( this ), true );
      }

    , regularAddressParts: function(){
        return {
          street1:  this.street1()
        , street2:  this.street2()
        , city:     this.city()
        , state:    this.state()
        , zip:      this.zip()
        };
      }

    , getAddressComponentLongName: function( component ){
        var component = utils.findWhere( this.address_components, function( c ){
          return c.types.indexOf( component ) > -1;
        });

        if ( !component ) return null;

        return component.long_name;
      }

    , street1: function(){
        return [
          this.getAddressComponentLongName('street_number')
        , this.getAddressComponentLongName('route')
        ].join(' ');
      }

    , street2: function(){
        return this.getAddressComponentLongName('premise');
      }

    , city: function(){
        return this.getAddressComponentLongName('city');
      }

    , state: function(){
        return this.getAddressComponentLongName('state');
      }

    , zip: function(){
        return this.getAddressComponentLongName('zip');
      }
    });
});
