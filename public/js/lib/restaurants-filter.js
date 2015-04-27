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
  var orderFulfillability = require('stamps/orders/fulfillability');

  module.exports = function( restaurants, query, options ){
    options = utils.defaults( options || {}, {
      sorts_by_no_contract: false
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
        ).length > 0;
      }

    , 'mealTypes': function( restaurant ){
        return utils.intersection(
          restaurant.meal_types, query.mealTypes
        ).length > 0;
      }
    };

    var sort = sorts[ query.sort ] || sorts.popular;

    var orderParams = utils.pick( query, 'zip', 'date', 'time', 'guests' );

    Object.keys( filters ).forEach( function( filter ){
      if ( !(filter in query) ) return;

      restaurants = restaurants.filter( filters[ filter ] );
    });

    if ( query.search ){
      restaurants = utils.search( restaurants, query.search, ['name'] );
    }

    if ( Object.keys( orderParams ).length > 0 ){
      var fulfillability = orderFulfillability( orderParams );
      restaurants = restaurants.filter( function( result ){
        fulfillability.restaurant = result;
        return fulfillability.isFulfillable();
      });
    }

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

    return utils.flatten( resultParts );
  };

  return module.exports;
});