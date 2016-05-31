var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var loggly = require('loggly');
var db = require('../../db');
var config = require('../../config');
var EnumStream = require('../../lib/enum-stream');
var elasticsearch = require('../../lib/elastic-search-client');

var logglyClient = loggly.createClient({
  token:      config.credentials['loggly.com'].token
, subdomain:  config.credentials['loggly.com'].subdomain
, tags:       [ process.env.GB_ENV, 'RestaurantSearchData' ]
});

var errorLog;

if ( config.env === 'dev' || true ){
  errorLog = fs.createWriteStream( __dirname + '/errors.json' );
  errorLog.write('[');
}

var logError = ( error, callback )=>{
  if ( config.env === 'dev' || true ){
    errorLog.write( JSON.stringify( error, true, '  ' ) + ',', callback );
  } else {
    logglyClient.log({
      message: 'Error logging data to elasticsearch'
    , level: 'error'
    , error
    }, callback );
  }
};

var esClient = elasticsearch();

var updateRestaurants = ( done )=>{
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
        esClient.update({
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
      // This is primarily to be defensive about not doing a TON
      // of writes while someone is performing a search
      .wait(50)
      .errors( error => process.stdout.write('x') )
      .errorsAsync( logError )
      .forEach( error => process.stdout.write('.') )
      .end( ()=> {
        if ( config.env === 'dev' ){
          errorLog.end( ']', ()=> process.exit(0) )
        } else {
          process.exit(0);
        }
      });
  });
};


async.waterfall([
  ( next )=> esClient.indices.exists({ index: 'restaurants' }, next )
, ( exists, status, next )=>{
    if ( exists ) return next();
    esClient.indices.create({ index: 'restaurants' }, error =>{
      if ( error ) throw error;
      return next();
    });
  }
, updateRestaurants
]);
