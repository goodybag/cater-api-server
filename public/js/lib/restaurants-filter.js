'use strict';

/**
 * Restaurant Filter
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var config = require('config');
  var orderFulfillability = require('stamps/orders/fulfillability');
  var orderDeliveryFee = require('stamps/orders/delivery-fee');

  var regs = {
    zip: /\d{5}/
  };

  module.exports = function( restaurants, query, options ){
    options = utils.defaults( options || {}, {
      sorts_by_no_contract: false
    , timezone:             'UTC'
    });

    var sorts = {
      'popular': function( a, b ){
        return b.popularity - a.popularity;
      }

    , 'name': function( a, b ){
        return a.name.localeCompare( b.name );
      }

    , 'price': function( a, b ){
        return a.price - b.price;
      }

    , 'delivery fee': function( a, b ){
        return a.delivery_fee_from - b.delivery_fee_from;
      }

    , 'order minimum': function( a, b ){
        return a.minimum_order - b.minimum_order;
      }
    };

    var filters = {
      'cuisines': function( restaurant ){
        return utils.intersection(
          restaurant.cuisine, query.cuisines
        ).length > 0;
      }

    , 'diets': function( restaurant ){
        return utils.intersection(
          restaurant.tags, query.diets
        ).length === query.diets.length;
      }

    , 'mealTypes': function( restaurant ){
        return utils.intersection(
          restaurant.meal_types, query.mealTypes
        ).length > 0;
      }
    };

    var sort = sorts[ query.sort ] || sorts.popular;

    var orderParams = utils.pick( query, 'zip', 'date', 'time', 'guests' );

    if ( query.datetime ){
      var parts = query.datetime.split(' ');
      orderParams.date = parts[0];
      orderParams.time = parts[1];
    }

    if ( typeof orderParams.zip === 'number' ){
      orderParams.zip += '';
    }

    if ( typeof orderParams.zip === 'string' ){
      if ( !regs.zip.test( orderParams.zip ) ){
        delete orderParams.zip
      } else {
        orderParams.zip = orderParams.zip.match( regs.zip )[0];
      }
    }

    if ( 'date' in orderParams || 'time' in orderParams ){
      let isValidDateTime = new Date(
        orderParams.date + (orderParams.time ? (' ' + orderParams.time) : '')
      ).toString() !== 'Invalid Date';

      if ( !isValidDateTime ){
        delete orderParams.date;
        delete orderParams.time;
      }
    }


    if ( 'guests' in orderParams && isNaN( +orderParams.guests ) ){
      delete orderParams.guests;
    }

    Object.keys( filters ).forEach( function( filter ){
      if ( !(filter in query) ) return;

      restaurants = restaurants.filter( filters[ filter ] );
    });

    if ( !config.elasticsearch.enabled )
    if ( typeof query.search === 'string' )
    if ( query.search.trim() ){
      restaurants = utils.search( restaurants, query.search.trim(), ['name'] );
    }

    var fulfillabilityOptions = utils.extend( orderParams, { timezone: options.timezone } );

    if ( Object.keys( orderParams ).length > 0 ){
      var omit = [ orderFulfillability.requirements.MinimumOrder ];
      var fulfillability = orderFulfillability( fulfillabilityOptions );

      if ( !orderParams.time ){
        omit.push( orderFulfillability.requirements.OpenHours );
      }

      restaurants = restaurants.filter( function( result ){
        fulfillability.restaurant = result;
        return fulfillability.isFulfillable({ omit: omit });
      });
    }

    // Add in delivery fee range
    // TODO: Move this to some restaurant model logic
    for ( var i = restaurants.length - 1, range, restaurant; i >= 0; i-- ){
      restaurant = restaurants[i];
      range = orderDeliveryFee( fulfillabilityOptions );
      range = range.getZipBasedRange( restaurant );

      restaurant.delivery_fee_from = range.min;
      restaurant.delivery_fee_to = range.max;
    }

    if ( !config.elasticsearch.enabled || typeof query.search !== 'string' || sort !== 'popular' ){
      var contractSort = options.sorts_by_no_contract;
      var resultParts = [];

      resultParts.push( restaurants.filter( function( r ){
        return !!r.is_featured;
      }));

      if ( contractSort ){
        resultParts.push( restaurants.filter( function( r ){
          return !!r.plan_id && !r.is_featured;
        }));
      }

      resultParts.push( restaurants.filter( function( r ){
        if ( contractSort ){
          return !r.is_featured && !r.plan_id;
        }

        return !r.is_featured;
      }));

      resultParts.forEach( function( part, i ){
        resultParts[ i ] = part.sort( sort );
      });

      restaurants = utils.flatten( resultParts );
    }

    return restaurants;
  };

  return module.exports;
});
