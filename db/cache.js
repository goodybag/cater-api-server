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

  [ 1, 2, 3, 4 ].forEach( function( id ){
    db.cache.restaurants[ id ] = fetchVal({
      fetch: function( callback ){
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

        options.many.push({ table: 'restaurant_delivery_times', alias: 'delivery_times' });
        options.many.push({ table: 'restaurant_delivery_zips', alias: 'delivery_zips' });
        options.many.push({ table: 'restaurant_lead_times', alias: 'lead_times' });

        // options.pluck.push({ table: 'restaurant_meal_styles', alias: 'meal_styles' });
        // options.pluck.push({ table: 'restaurant_meal_types', alias: 'meal_types' });

        db.restaurants.find( $query, options, callback )
      }
    });
  });
};