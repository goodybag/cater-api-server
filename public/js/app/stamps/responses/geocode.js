/**
 * Geocode
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var config        = require('config');
  var utils         = require('utils');
  var geocodeResult = require('./geocode-result');

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
            return this.results.some( function( r ){
              return geocodeResult( r ).isValid();
            }.bind( this ));
          }

        // TODO compare tokens for similarity
        // , function(){
        //     return this.results.filter( function( result ){
        //       return result.types.indexOf('street_address') > -1;
        //     }).some( function( result ){
        //       return this.requestAddress
        //     });
        //   }
        ].every( function( fn ){
          return fn.call( this );
        }.bind( this ));
      }

      /**
       * Uses the first street address result in body.results
       * to be parsed into an address
       * @return {Address} ../addresses/base
       */
    , toAddress: function(){
        // Get the first match from the intersection of results and accepted types
        var result;
        for ( var i = 0, l = geocodeResult.acceptableTypes.length; i < l; i++ ){
          result = utils.findWhere( this.results, function( r ){
            return r.types.indexOf( geocodeResult.acceptableTypes[i] ) > -1;
          }.bind( this ));

          if ( result ) break;
        }

        return geocodeResult( result ).toAddress();
      }
    });
});
