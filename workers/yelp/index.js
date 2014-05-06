/**
 * Yelp Worker
 */

var util      = require('util');
var utils     = require('../../utils');
var Models    = require('../../models');
var config    = require('../../config');
var yelp      = require('yelp');

yelp = yelp.createClient({
  consumer_key:     config.yelp.consumerKey
, consumer_secret:  config.yelp.consumerSecret
, token:            config.yelp.token
, token_secret:     config.yelp.tokenSecret
});
var errors = [];

var stats = {
  businessesAttempted:  { text: 'Businesses attempted', value: 0 }
, completed:            { text: 'Businesses completed', value: 0 }
, errors:               { text: 'Number of errors', value: 0 }
};

var tickOut = function( val ){
  util.print( val ? 'x' : '.' );
};

var logStats = function(){
  console.log("\n\n");
  console.log("########################");
  console.log("##### Lovely Stats #####");
  console.log("########################");
  console.log("\n");
  for ( var key in stats ){
    console.log("  *", stats[ key ].text + ": ", stats[ key ].value);
  }
  console.log("\n\n");
};

var onComplete = function(){
  logStats();
  process.exit(0);
};

var onError = function( error ){
  if ( error ){
    console.log( error );
    process.exit(1);
  }
};

var getGbBusinesses = function( callback ){
  var $query = {
    where: {
      yelp_business_id: { $notNull: true }
    },
    limit: 'all'
  };

  Models.Restaurant.find( $query, function( error, results ){
    if ( error ) return callback( error );
    return callback( null, results.map( function( r ){ return r.attributes; }) );
  });
};

var saveBusinessYelpData = function( id, data, callback ){
  // Filter out reviews that are under our threshold
  if ( 'reviews' in data ){
    data.reviews = data.reviews.filter( function( review ){
      return review.rating >= config.yelp.reviewThreshold
    });
  }

  var $query = {
    where: { id: id }
  , updates: {
      yelp_data: JSON.stringify( utils.pick( data, config.yelp.concernedFields ) )
    }
  };

  Models.Restaurant.update( $query, callback );
};

console.log("\n\n")
console.log("##########################");
console.log("# Running Yelp Collector #");
console.log("##########################");

getGbBusinesses( function( error, businesses ){
  if ( error ) return onError( error );

  stats.businessesAttempted.value = businesses.length;

  var fns = businesses.map( function( business ){

    return function( done ){
      var localOnError = function( error ){
        if ( !error ) return

        stats.errors.value++;
        errors.push( error );
        console.log( error.statusCode === 404 ? (business.yelp_business_id + ' not found') : error );
        tickOut( 1 );
        return done();
      };

      yelp.business( business.yelp_business_id, function( error, data ){
        if ( error ) return localOnError( error );

        saveBusinessYelpData( business.id, data, function( error ){
          if ( error ) return localOnError( error );

          stats.completed.value++;
          tickOut();
          done();
        });
      });
    };
  });

  utils.async.series( fns, function( error ){
    if ( error ) return onError( error );

    onComplete();
  });
});