/**
 * Distance Matrix
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var Promise = require('bluebird');
  var config  = require('config');
  var utils   = require('utils');
  var base    = require('./base');
  var errors  = require('errors');

  return module.exports = require('stampit')()
    .compose( base )
    .state({
      origins:      []
    , destinations: []
    , arrivalTime:  null
    })
    .enclose( function(){
      this.json();
      this.url( config.google.distanceMatrix.url );
      this.query( 'key', config.google.apiKey );

      // Get back distances in miles and feet
      this.query( 'units', 'imperial' );
    })
    .methods({
      getOriginDestinationQuery: function(){
        var query = {
          origins:      this.origins.join('|')
        , destinations: this.destinations.join('|')
        };

        if ( this.arrivalTime ){
          query.arrival_time = +this.arrivalTime;
        }

        return query;
      }

    , parseResponse: function( res ){
        var body = res[1];

        if ( body.status in errors.google.distanceMatrix ){
          return Promise.reject( errors.google.distanceMatrix[ body.status ] );
        }

        return body.rows;
      }

    , send: function( callback ){
        this.query( this.getOriginDestinationQuery() );

        return base.fixed.methods.send.call( this )
          .then( function( res ){
            return this.parseResponse( res );
          }.bind( this ))
          .asCallback( callback );
      }
    });
});
