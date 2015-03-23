/**
 * Worker.Popularity
 *
 * Updates popularity on restaurants
 *
 * NOTE:
 *   I'm leaving this all in a super-hacky single module for now
 *   and will likely later put it in a stamp/proto for mixing in
 *   to models. Will refactor into nice business logic later!
 */

var config  = require('../../config');
var db      = require('../../db');
var logger  = require('../../lib/logger').create('Worker-Popularity');
var utils   = require('../../utils');

utils.async.waterfall([
  // Get restaurants with num orders
  db.restaurants.find.bind( db.restaurants, { is_hidden: false, is_archived: false }, {
    limit: 'all'
  , order: 'num_orders desc'
  , columns: [ '*', {
      type: 'expression'
    , alias: 'num_orders'
    , expression: {
        type:         'select'
      , parenthesis:  true
      , table:        'orders'
      , columns:      [{ expression: 'count(id)' }]
      , where: {
          restaurant_id:  '$restaurants.id$'
        , status:         'accepted'
        }
      }
    }]
  })


, function( restaurants, next ){
    var MAX = restaurants[0].num_orders;
    var MIN = restaurants[ restaurants.length - 1 ].num_orders;

    logger.info( 'Processing', restaurants.length, 'restaurants', {
      min: MIN
    , max: MAX
    });

    // Initialize popularity at a normalized version of num_orders
    restaurants.forEach( function( restaurant ){
      restaurant.popularity = utils.normalize( restaurant.num_orders, MIN, MAX );
    });

    next( null, restaurants );
  }

, function( restaurants, next ){
    var onRestaurant = function( restaurant, done ){
      db.restaurants.update( restaurant.id, { popularity: restaurant.popularity }, done );
    };

    utils.async.eachLimit( restaurants, config.popularity.limit, onRestaurant, next );
  }
], function( error ){
  if ( error ){
    logger.error('Error updating popularity', {
      error: error
    });

    return process.exit(1);
  }

  logger.info('Popularity update complete!');
  return process.exit(0);
});