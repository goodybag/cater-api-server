var fetchVal = require('../lib/fetch-val');

module.exports = function( db ){
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

  [ 1, 2, 3, 4 ].forEach( function( id ){
    db.cache.restaurants[ id ] = fetchVal({
      period: 1000 * 10

    , fetch: function( callback ){
        var $query = {
          region_id: id
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
        options.many.push({ table: 'restaurant_tags', alias: 'tags' });

        options.pluck.push({ table: 'restaurant_meal_styles', alias: 'meal_styles', column: 'meal_style' });
        options.pluck.push({ table: 'restaurant_meal_types', alias: 'meal_types', column: 'meal_type' });

        db.restaurants.find( $query, options, function( error, results ){
          if ( error ){
            return callback( error );
          }

          results.forEach( function( restaurant ){
            restaurant.region.delivery_services = db.cache.delivery_services.byRegion( id );
          });

          return callback( null, results );
        });
      }
    });

    db.cache.delivery_services[ id ] = fetchVal({
      fetch: function( callback ){
        var $query = {
          region_id: id
        , is_hidden: false
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
};