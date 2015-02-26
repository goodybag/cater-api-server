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
  var base    = require('./base');
  var GeoRes  = require('../responses/geocode');

  return module.exports = require('stampit')()
    .compose( base )
    .enclose( function(){
      this.json();
      this.url( config.google.geocoding.url );
      this.query( 'key', config.google.apiKey );
    })
    .methods({
      address: function( address ){
        if ( typeof address !== 'string' ){
          throw new Error('Invalid parameter');
        }

        this.req.qs.address = address;

        return this;
      }

    , send: function( callback ){
        if ( !this.req.qs.address ){
          throw new Error('Must supply address before sending');
        }

        return base.fixed.methods.send.call( this )
          .then( function( res ){
            return GeoRes.create({
              res: res
            , requestAddress: this.req.qs.address
            });
          }.bind( this ))
          .then( function( geores ){
            if ( callback ) return callback( null, geores );
          }.bind( this ))
          .error( function( error ){
            if ( callback ) callback( error );
          }.bind( this ));
      }
    })
});