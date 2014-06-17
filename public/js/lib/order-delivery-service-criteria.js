/**
 * Order delivery service criteria
 *
 * An array of functions of the following schema
 *
 * Boolean function( Object order ){}
 *
 * The function should describe a single criterion for whether
 * or not an order should be picked up by a delivery service.
 * Returns true for delivery service, false for no
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function( factory ){
    module.exports = factory( require, exports, module );
  };
}

define(function( require, exports, module ){
  var moment = require('moment-timezone');
  var utils = require('utils');

  exports = {
    criteria: []

  , check: function( order ){
      return utils.some( exports.criteria, function( criterion ){
        return criterion.fn( order );
      });
    }

  , add: function( criterion ){
      utils.enforceRequired( criterion, [
        'name', 'fn'
      ]);

      criterion = utils.defaults( criterion, {
        requirements: []
      });

      // Simply return false if the required fields are not present
      criterion.fn = utils.wrap( criterion.fn, function( fn, order ){
        if ( !utils.hasPropsDeep( order, criterion.requirements ) ){
          return false;
        }

        return fn( order );
      });

      exports.criteria.push( criterion );
    }
  };

  // Is dollar amount too low?
  exports.add({
    name: 'dollar_amount'
  , requirements: [
      'sub_total'
    , 'restaurant.delivery_service_order_amount_threshold'
    ]
  , fn: function( order ){
      return order.sub_total < order.restaurant.delivery_service_order_amount_threshold;
    }
  });

  // Is head count too low?
  exports.add({
    name: 'head_count'
  , requirements: [
      'guests'
    , 'restaurant.head_count_delivery_service_threshold'
    ]
  , fn: function( order ){
      return order.guests < order.restaurant.head_count_delivery_service_threshold;
    }
  });

  // Delivery zips
  exports.add({
    name: 'delivery_zips'
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
  exports.add({
    name: 'delivery_times'
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
  });

  // Lead times
  exports.add({
    name: 'lead_times'
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

      var now = moment().tz( restaurant.region.timezone ).format('YYYY-MM-DD HH:mm:ss');
      var minutes = (moment( date ) - moment( now )) / 60000;
      var leadTime = limit.lead_time;

      if ( isDeliveryService ){
        leadTime += moment.duration( restaurant.region.lead_time_modifier ).asMinutes();
        return minutes >= leadTime;
      } else {
        return !(minutes >= leadTime);
      }
    }
  })

  return exports;
});