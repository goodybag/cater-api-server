if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function( factory ){
    module.exports = factory( require, exports, module );
  };
}

define(function( require, exports, module ){
  var moment = require('moment-timezone');
  var utils = require('utils');

  return utils.map([
    // Is dollar amount too low?
    function( order ){
      return order.sub_total < order.restaurant.delivery_service_order_amount_threshold;
    }

    // Is head count too low?
  , function( order ){
      if ( typeof order.guests !== 'number' ) return false;

      return order.guests < order.restaurant.head_count_delivery_service_threshold;
    }

    // Delivery zips
  , function( order ){
      // Was not in delivery_zips
      if ( order.restaurant.delivery_zips.indexOf( order.zip ) === -1 ){
        // But if it was in zip_groups, then that's from delivery service zips
        return !!utils.find( order.restaurant.delivery_zip_groups, function( group ){
          return group.zips.indexOf( order.zip ) > -1;
        });
      }

      return false;
    }

    // Delivery times
  , function( order ){
      var date = order.datetime;

      if ( !moment( date ).isValid() ) return false;

      var restaurant  = order.restaurant;
      var day         = moment( date.split(' ')[0] ).day();
      var hours       = restaurant.delivery_times[ day ];
      var time        = ( date.split(' ')[1] + ':00' ).substring( 0, 8 );
      // is the desired time within any of the windows for that day?
      var result = utils.any( hours, function( openClose ){
        return time >= openClose[0] && time <= openClose[1];
      });

      if ( result ) return false;

      date  = moment( date ).add( 'minutes', -restaurant.region.lead_time_modifier || 0 );
      day   = date.day();
      hours = restaurant.delivery_times[ day ];
      time  = date.format('HH:mm:ss');

      // Restaurant couldn't ful-fill, what about delivery services?
      return utils.chain(
        restaurant.hours_of_operation[ day ]
      ).any( function( openClose ){
        return time >= openClose[0] && time <= openClose[1]
      }).value();
    }

    // Lead times
  , function( order ){
      var date = order.datetime;

      if ( !moment( date ).isValid() ) return false;

      var restaurant = order.restaurant;

      var isDeliveryService = false;
      var limit = utils.find( utils.sortBy( restaurant.lead_times, 'max_guests' ), function( obj ){
        return obj.max_guests >= order.guests;
      });

      if ( !limit ){
        isDeliveryService = true;
        limit = utils.find( utils.sortBy( restaurant.pickup_lead_times, 'max_guests' ), function( obj ){
          return obj.max_guests >= order.guests;
        });
      }

      if ( !limit ) return false;

      var now = moment().tz( restaurant.region.timezone ).format('YYYY-MM-DD HH:mm:ss');
      var minutes = (moment( date ) - moment( now )) / 60000;
      var leadTime = limit.lead_time;

      if ( isDeliveryService ){
        leadTime += moment.duration( restaurant.region.lead_time_modifier ).asMinutes();
        console.log(minutes, leadTime);
        return minutes >= leadTime;
      } else {
        return !(minutes >= leadTime);
      }
    }
  ], function( fn ){
    return function( order ){
      utils.enforceRequired( order, [
        'restaurant', 'sub_total', 'guests', 'zip', 'datetime'
      ]);

      utils.enforceRequired( order.restaurant, [
        'delivery_service_order_amount_threshold'
      , 'head_count_delivery_service_threshold'
      , 'delivery_zips'
      , 'delivery_zip_groups'
      , 'lead_times'
      , 'pickup_lead_times'
      , 'region'
      ]);

      utils.enforceRequired( order.restaurant.region, [
        'timezone'
      , 'lead_time_modifier'
      ]);

      return fn( order );
    }
  });
});