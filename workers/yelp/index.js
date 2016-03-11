var _ = require('highland');
var yelp = require('yelp');
var db = require('../../db');
var utils = require('../../utils');
var config = require('../../config');
var logger = require('../../lib/logger').create('Yelp-Worker');

var yelpClient = yelp.createClient({
  consumer_key:     config.yelp.consumerKey
, consumer_secret:  config.yelp.consumerSecret
, token:            config.yelp.token
, token_secret:     config.yelp.tokenSecret
});

var query = {
  yelp_business_id: { $notNull: true, $ne: '' }
};

var options = {
  limit: 'all'
};

db.restaurants.findStream( query, options, function( error, stream ){
  if ( error ) throw error;

  _( stream )
    .flatMap( _.wrapCallback( function( restaurant, next ){
      yelpClient.business( restaurant.yelp_business_id, function( error, result ){
        if ( error ){
          error.restaurant_id = restaurant.id;
          return next( error );
        }

        restaurant.yelp_data = utils.pick( result, config.yelp.concernedFields );

        next( null, restaurant );
      });
    }))
    .flatMap( _.wrapCallback( function( restaurant, next ){
      var update = {
        yelp_data: restaurant.yelp_data
      };

      db.restaurants.update( restaurant.id, update, function( error ){
        if ( error ){
          error.restaurant_id = restaurant.id;
        }

        return next( error, restaurant );
      });
    }))
    .errors( function( error ){
      logger.warn('Error processing restaurant', {
        error: error
      });
    })
    .each( function( data ){
      process.stdout.write('.');
    })
    .parallel(5)
    .done( function(){
      process.exit(0);
    });
});