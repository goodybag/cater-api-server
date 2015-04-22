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
      // Since _all_ of these strategies are required to be fulfillable
      // put the computationally least complex strategies first
      fulfillmentRequirements: [
        // function orderFulfillmentStrategyGuests(){
        //   if ( !this.guests ) return true;

        //   if ( !this.restaurant.)
        //   if ( this.guests )
        //   return true;
        // }

        // Simply check if the zip is supported by delivery
      , function orderFulfillmentStrategyZip(){
          if ( !this.zip ) return true;

          var zips = this.getAllSupportedDeliveryZips();

          return !!_.findWhere( zips, { zip: this.zip } );
        }

        // Is
      , function orderFulfillmentStrategyDate(){
          return true;
        }
      ]

    , isFulfillable: function(){
        return this.fulfillmentRequirements.every( function( strategy ){
          return strategy.call( this );
        }.bind( this ));
      }

    , getAllSupportedDeliveryZips: function(){
        var zips = [];

        if ( this.restaurant.supported_order_types.indexOf('delivery') > - 1 ){
          zips = this.restaurant.delivery_zips.map( function( dzip ){
            return _.pick( dzip, 'zip', 'fee' )
          });
        }

        if ( this.restaurant.supported_order_types.indexOf('courier') > - 1 ){
          zips = zips.concat( this.getDeliveryServiceZips() );
        }

        return zips;
      }

    , getDeliveryServiceZips: function(){
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

        return _.flatten( dszips );
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