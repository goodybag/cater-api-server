if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function( factory ){
    module.exports = factory( require, exports, module );
  };
}

define(function( require, exports, module ){
  var moment = require('moment-timezone');
  var utils = require('utils');

  exports = [];

  exports.push({
    name: 'restaurant_supported_types'
  , type: 'every'
  , requirements: [
      'restaurant.supported_order_types'
    ]
  , fn: function( order ){
      return order.restaurant.supported_order_types.indexOf('courier') > -1;
    }
  });

  // Is head count too low?
  exports.push({
    name: 'head_count'
  , type: 'some'
  , requirements: [
      'guests'
    , 'restaurant.delivery_service_head_count_threshold'
    ]
  , fn: function( order ){
      return order.guests < order.restaurant.delivery_service_head_count_threshold;
    }
  });

  // Delivery zips
  exports.push({
    name: 'delivery_zips'
  , type: 'some'
  , requirements: [
      'zip'
    , 'restaurant.delivery_zips'
    , 'restaurant.delivery_zip_groups'
    ]
  , fn: function( order ){
      // Was not in delivery_zips
      if ( order.restaurant.delivery_zips.indexOf( order.zip ) === -1 ){
        // But if it was in zip_groups, then that's from delivery service zips
        return !!utils.find( order.restaurant.delivery_zip_groups, function( group ){
          return group.zips.indexOf( order.zip ) > -1;
        });
      }

      return false;
    }
  });

  // Delivery times
  exports.push({
    name: 'delivery_times'
  , type: 'some'
  , requirements: [
      'datetime'
    , 'restaurant.delivery_times'
    , 'restaurant.hours_of_operation'
    , 'restaurant.region.lead_time_modifier'
    ]
  , fn: function( order ){
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

      date  = moment( date ).add( 'minutes', -moment.duration( restaurant.region.lead_time_modifier ).asMinutes() );
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
  });

  // Lead times
  exports.push({
    name: 'lead_times'
  , type: 'some'
  , requirements: [
      'datetime'
    , 'restaurant.lead_times'
    , 'restaurant.pickup_lead_times'
    , 'restaurant.region.timezone'
    , 'restaurant.region.lead_time_modifier'
    ]
  , fn: function( order ){
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

      if ( order.status !== 'pending' && !order.submitted ){
        return false;
      }

      var nowDateString = order.status === 'pending' ? undefined : order.submitted;

      var now = moment( nowDateString ).tz( restaurant.region.timezone ).format('YYYY-MM-DD HH:mm:ss');
      var minutes = (moment( date ) - moment( now )) / 60000;
      var leadTime = limit.lead_time;

      if ( isDeliveryService ){
        leadTime += moment.duration( restaurant.region.lead_time_modifier ).asMinutes();
        return minutes >= leadTime;
      } else {
        return !(minutes >= leadTime);
      }
    }
  });

  // Is dollar amount too low?
  exports.push({
    name: 'dollar_amount'
  , type: 'some'
  , requirements: [
      'sub_total'
    , 'restaurant.delivery_service_order_amount_threshold'
    ]
  , fn: function( order ){
      if ( order.sub_total < (order.restaurant.minimum_order || 0) ) return false;
      return order.sub_total < order.restaurant.delivery_service_order_amount_threshold;
    }
  });

  exports.push({
    name: 'restaurant_no_delivery'
  , type: 'some'
  , requirements: [
      'restaurant.supported_order_types'
    ]
  , fn: function( order ){
      return order.restaurant.supported_order_types.indexOf('delivery') === -1;
    }
  });

  return exports;
});
