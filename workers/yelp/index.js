/**
 * Yelp Worker
 */

var util      = require('util');
var utils     = require('../utils');
var Models    = require('../models');

var stats = {
  businessesAttempted:  { text: 'Businesses attempted', value: 0 }
, completed:            { text: 'Businesses completed', value: 0 }
};

var tickOut = function( val ){
  util.puts( val ? 'x' : '.' );
};

var logStats = function(){
  console.log("\n\n");
  console.log("*########################*");
  console.log("*##### Lovely Stats #####*");
  console.log("*########################*");
  console.log("\n\n");
  for ( var key in stats ){
    console.log("  ", stats[ key ].text, ": ", stat[ key ].value);
  }
  console.log("\n\n");
};

var onComplete = function(){
  logStats();
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
      yelp__id
    }
  };

  Models.restaurants.find( $query, function( error, results ){
    if ( error ) return callback( error );

    return callback( null, utils.invoke( 'toJSON', results ) );
  });
};

var getBusinessYelpData = function( id, callback ){

};

var saveBusinessYelpData = function( id, data, callback ){

};

getBusinesses( function( error, businesses ){
  if ( error ) return onError( error );

  stats.businessesAttempted.value = businesses.length;

  var fns = businesses.map( function( business ){

    return function( done ){
      var localOnError = function( error ){
        if ( error ) return console.log( error ), done();
      };

      getBusinessYelpData( business.id, function( error, data ){
        if ( error ) return localOnError( error );

        saveBusinessYelpData( business.id, data, function( error ){
          if ( error ) return console.log( error ), done();

          stats.completed.value++;
          tickOut();
          done();
        });
      });
    };
  });

  utils.series( fns );
});