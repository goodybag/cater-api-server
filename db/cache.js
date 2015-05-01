/**
 * Db.Cache
 *
 * Uses a fetchVal to cache resources.
 *
 * API
 *
 *    `db.cache.restaurants`
 *      Contains resataurants fetchVals keyed by region.
 *    `db.cache.restaurants.byRegion( region_id )`
 *      Function to easily access restaurants by region id
 *
 *      var results = db.cache.restaurants.byRegion(1);
 *
 *      if ( results.error ){
 *        return res.error( results.error );
 *      }
 *
 *      results
 *        .filter( function( resaurant ){
 *          ...
 *        })
 *        ...
 *        
 *    `db.cache.delivery_services`
 *      Same as restaurants, but delivery_services.
 *    `db.cache.delivery_services.byRegion( region_id )`
 *      Function to easily access delivery services by region id
 */

var redis     = require('redis');
var config    = require('../config');
var fetchVal  = require('../lib/fetch-val');

module.exports.setupBasicStructure = function( db ){
  db.cache = {};

  db.cache.restaurants = {};

  db.cache.restaurants.byRegion = function( region ){
    if ( !(region in db.cache.restaurants) ){
      throw new Error('Invalid cache key');
    }

    var fVal = db.cache.restaurants[ region ];
    var result = fVal.valueOf();

    if ( fVal.error ) result.error = fVal.error;

    return result;
  };

  db.cache.delivery_services = {};

  db.cache.delivery_services.byRegion = function( region ){
    if ( !(region in db.cache.delivery_services) ){
      throw new Error('Invalid cache key');
    }

    var fVal = db.cache.delivery_services[ region ];
    var result = fVal.valueOf();

    if ( fVal.error ) result.error = fVal.error;

    return result;
  };
};

module.exports.autoFetchFromRedis = function( db ){
  db.regions.find( {}, { limit: 'all' }, function( error, regions ){
    if ( error ) throw error;

    regions.forEach( function( region ){
      db.cache.restaurants[ region.id ] = fetchVal({
        period: 1000 * 60 * 6

      , fetch: function( callback ){
          var client = redis.createClient( config.redis.port, config.redis.hostname, config.redis );

          client.get( 'restaurants-' + region.id, function( error, results ){
            client.quit();

            if ( error ){
              return callback( error );
            }

            try {
              results = JSON.parse( results );
            } catch( e ){
              return callback( e );
            }

            results.forEach( function( restaurant ){
              restaurant.region.delivery_services = db.cache.delivery_services.byRegion( region.id );
            });

            callback( null, results );
          });
        }
      });

      db.cache.delivery_services[ region.id ] = fetchVal({
        period: 1000 * 60 * 6

      , fetch: function( callback ){
          var client = redis.createClient( config.redis.port, config.redis.hostname, config.redis );

          client.get( 'delivery_services-' + region.id, function( error, results ){
            client.quit();

            if ( error ){
              return callback( error );
            }

            try {
              results = JSON.parse( results );
            } catch( e ){
              return callback( e );
            }

            callback( null, results );
          });
        }
      });
    });
  });
};

module.exports.autoFetchFromDb = function( db ){
  db.regions.find( {}, { limit: 'all' }, function( error, regions ){
    if ( error ) throw error;

    regions.forEach( function( region ){
      db.cache.restaurants[ region.id ] = fetchVal({
        period: 1000 * 60 * 2

      , fetch: function( callback ){
          var $query = {
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
          options.many.push({ table: 'restaurant_tags', alias: 'tags' });

          options.pluck.push({ table: 'restaurant_meal_styles', alias: 'meal_styles', column: 'meal_style' });
          options.pluck.push({ table: 'restaurant_meal_types', alias: 'meal_types', column: 'meal_type' });

          db.restaurants.find( $query, options, function( error, results ){
            if ( error ){
              return callback( error );
            }

            results.forEach( function( restaurant ){
              restaurant.region.delivery_services = db.cache.delivery_services.byRegion( region.id );
            });

            return callback( null, results );
          });
        }
      });

      db.cache.delivery_services[ region.id ] = fetchVal({
        period: 1000 * 60 * 2

      , fetch: function( callback ){
          var $query = {
            region_id: region.id
          };

          var options = {
            limit: 'all'
          , one:    []
          , many:   [ { table: 'delivery_service_zips', alias: 'zips' } ]
          , pluck:  []
          , with:   []
          };

          db.delivery_services.find( $query, options, callback )
        }
      });
    });
  });
};