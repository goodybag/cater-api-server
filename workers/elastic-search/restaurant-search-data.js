var fs = require('fs');
var elasticsearch = require('elasticsearch');
var async = require('async');
var _ = require('lodash');
var loggly = require('loggly');
var db = require('../../db');
var config = require('../../config');
var EnumStream = require('../../lib/enum-stream');
var Logger = require('loglog/lib/logger');

var logglyClient = loggly.createClient({
  token:      config.credentials['loggly.com'].token
, subdomain:  config.credentials['loggly.com'].subdomain
, tags:       ['RestaurantSearchData']
});

Logger.prototype.trace = Logger.prototype.info;
Logger.prototype.warning = Logger.prototype.warn;

var errorLog;

if ( process.env.GB_ENV === 'dev' ){
  errorLog = fs.createWriteStream( __dirname + '/errors.json' );
  errorLog.write('[');
}

var logError = ( error, callback )=>{
  if ( process.env.GB_ENV === 'dev' ){
    errorLog.write( JSON.stringify( error, true, '  ' ) + ',', callback );
  } else {
    logglyClient.log({
      message: 'Error logging data to elasticsearch'
    , level: 'error'
    , error
    }, callback );
  }
};


var client = new elasticsearch.Client({
  host: 'localhost:9200'
, log: Logger
});

var options = {
  columns: ['id', 'name', 'description', 'cuisine', 'region_id']
, many: [ { table: 'categories'
          , columns: ['name', 'description']
          , where: { is_hidden: false }
          }
        , { table: 'items'
          , columns: ['name', 'description']
          , where: { is_hidden: false }
          }
        , { table: 'amenities'
          , columns: ['name', 'description']
          }
        ]
};

db.restaurants.findStream( {}, options, ( error, results )=>{
  if ( error ){
    throw error;
  }

  EnumStream
    .create( results, { concurrency: 1 } )
    .mapAsync( ( restaurant, next )=>{
      client.update({
        index:          'restaurants'
      , type:           'restaurant'
      , id:             restaurant.id
      , body:           { doc: restaurant }
      , doc_as_upsert:  true
      }, ( error, response )=>{
        if ( error ){
          error.restaurant_id = restaurant.id;
          return next( error );
        }

        next( null, response );
      });
    })
    // Ensure we don't max out elasticsearch's update queue
    .wait(50)
    .errors( error => process.stdout.write('x') )
    .errorsAsync( logError )
    .forEach( error => process.stdout.write('.') )
    .end( ()=> {
      if ( process.env.GB_ENV === 'dev' ){
        errorLog.end( ']', ()=> process.exit(0) )
      } else {
        process.exit(0);
      }
    });
});
