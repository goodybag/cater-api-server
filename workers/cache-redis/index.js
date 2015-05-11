/**
 * This file currently focuses on caching objects by region.
 * If you'd like to add a new region cache, simply add a new
 * entry to the regionCaches object. The cache will be keyed
 * by your object key appended with a hyphen and region id.
 *
 * So, the restaurants in region 3 could be accessed with:
 *
 * client.get('restaurants-3', function( error, results ){ ... })
 *
 * Each regionCache definition should return an async function
 * that accepts a single argument: callback( error, results );
 *
 * We will assume that results is a JSON string.
 */

var config  = require('../../config');
var db      = require('../../db');
var utils   = require('../../utils');
var logger  = require('../../lib/logger').create('Worker-CacheRedis');

var client  = require('redis').createClient( config.redis.port, config.redis.hostname, config.redis );

var regionCaches = {
  restaurants: function( region ){
    var query = {
      region_id: region.id
    , is_hidden: false
    };

    var options = {
      limit: 'all'
    , one:    []
    , many:   []
    , pluck:  []
    , with:   []
    };

    options.one.push({ table: 'regions', alias: 'region' });

    options.many.push({ table: 'restaurant_locations', alias: 'locations' });
    options.many.push({ table: 'restaurant_delivery_times', alias: 'delivery_hours' });
    options.many.push({ table: 'restaurant_hours', alias: 'hours' });
    options.many.push({ table: 'restaurant_delivery_times', alias: 'delivery_times' });
    options.many.push({ table: 'restaurant_delivery_zips', alias: 'delivery_zips' });
    options.many.push({ table: 'restaurant_lead_times', alias: 'lead_times' });
    options.many.push({ table: 'restaurant_pickup_lead_times', alias: 'pickup_lead_times' });

    options.pluck.push({ table: 'restaurant_tags', alias: 'tags', column: 'tag' });
    options.pluck.push({ table: 'restaurant_meal_styles', alias: 'meal_styles', column: 'meal_style' });
    options.pluck.push({ table: 'restaurant_meal_types', alias: 'meal_types', column: 'meal_type' });

    return db.restaurants.find.bind( db.restaurants, query, options );
  }

, delivery_services: function( region ){
    var query = {
      region_id: region.id
    };

    var options = {
      limit: 'all'
    , one:    []
    , many:   [ { table: 'delivery_service_zips', alias: 'zips' } ]
    , pluck:  []
    , with:   []
    };

    return db.delivery_services.find.bind( db.delivery_services, query, options );
  }
};

var saveRegion = function( region, done ){
  logger.debug('Processing region', region.id, region.name);

  utils.async.parallel(
    utils.object(
      Object.keys( regionCaches )
    , Object.keys( regionCaches )
        .map( function( cacheName ){
          return regionCaches[ cacheName ]( region );
        })
    )
  , function( error, results ){
      if ( error ) return done( error );

      utils.async.each(
        Object.keys( results )
      , function( cacheName, next ){
          var key = cacheName + '-' + region.id;

          logger.debug('Setting cache', key, 'with', results[ cacheName ].length, 'results');

          client.set(
            key
          , JSON.stringify( results[ cacheName ] )
          , next
          );
        }
      , done
      );
    }
  );
};

utils.async.waterfall([
  db.regions.find.bind( db.regions, {}, { limit: 'all' } )
, function( regions, next ){
    logger.info('Processing', regions.length, 'regions');

    // For now, just 1 region at a time, but we'll experiment with the value
    utils.async.eachLimit( regions, 1, saveRegion, next );
  }
], function( error ){
  client.quit();

  if ( error ){
    logger.error('Error creating cache', {
      error: error
    });

    process.exit(1);
  }

  process.exit(0);
});