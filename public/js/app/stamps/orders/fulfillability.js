/**
 * Orders.Fulfillability
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var _ = require('lodash');

  return require('stampit')()
    .state({
      
    })
    .enclose( function(){

    })
    .methods({
      fulfillmentRequirements: [
        // Simply check if the zip is supported by delivery
        function orderFulfillmentStrategyZip(){
          if ( !this.zip ) return true;

          var zips = this.getAllSupportedDeliveryZips();

          return !!_.findWhere( zips, { zip: this.zip } );
        }

      , function orderFulfillmentStrategyDate(){
          return true;
        }

      , function orderFulfillmentStrategyGuests(){
          return true;
        }
      ]

    , isFulfillable: function(){
        return this.fulfillmentRequirements.every( function( strategy ){
          return strategy.call( this );
        }.bind( this ));
      }

    , getAllSupportedDeliveryZips: function(){
        var originZips = this.getAllOriginZips();

        var dszips = this.restaurant.region.delivery_services.map( function( ds ){
          return ds.zips
            .filter( function( dszip ){
              return originZips.indexOf( dszip.from ) > -1;
            })
            .map( function( dszip ){
              return { zip: dszip.from, fee: dszip.price };
            });
        });

        dszips = _.flatten( dszips );

        return this.restaurant.delivery_zips
          .map( function( dzip ){
            return _.pick( dzip, 'zip', 'fee' )
          }).concat( dszips );
      }

    , getAllOriginZips: function(){
        return [
          this.restaurant.zip
        ].concat(
          _.pluck( this.restaurant.locations, 'zip' )
        );
      }
    });
});