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
  var moment = require('moment');

  return require('stampit')()
    .state({
      
    })
    .enclose( function(){
      if ( this.date ){
        this.datetime = moment( this.date + ( this.time ? (' ' + this.time) : '' ) );
      }
      console.log(this.date, this.time);
    })
    .methods({
      // Since _all_ of these strategies are required to be fulfillable
      // put the computationally least complex strategies first
      fulfillmentRequirements: [
        // Simply check if the zip is supported by delivery
        function strategyZip(){
          if ( !this.zip ) return true;

          var zips = this.getAllSupportedDeliveryZips();

          return !!_.findWhere( zips, { zip: this.zip } );
        }

        // Is the restaurant even open on that day?
      , function strategyOpenDay(){
          if ( !this.datetime ) return true;

          var hours = this.restaurant.hours.concat( this.restaurant.delivery_hours );

          return !!_.findWhere( hours, {
            day: this.datetime.day()
          });
        }

        // Restaurant is open on that day, but what about time?
      , function strategyOpenHours(){
          if ( !this.time ) return true;

          var day = this.datetime.day();

          return this.restaurant.hours
            .concat( this.restaurant.delivery_hours )
            .filter( function( dayHours ){
              return dayHours.day === day;
            })
            .some( function( dayHours ){
              return [
                moment( this.date + ' ' + dayHours.start_time ) <= this.datetime
              , this.datetime < moment( this.date + ' ' + dayHours.end_time )
              ].every( _.identity );
            }.bind( this ));
        }

        // Is there a lead time that satisfies?
      , function strategyDate(){
          return true;

          if ( this.restaurant.lead_times.length === 0 ){
            return true;
          }

          if ( !this.datetime ) return true;
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