var Promise   = require('bluebird');
var db        = require('db');
var utils     = require('utils');
var PMS       = require('stamps/payment-summaries/db');
var logger    = require('../../lib/logger').create('Worker-PaymentSummaries');
var now       = require('stamps/datetime')({
                  datetime: process.argv.length < 3 ? new Date() : process.argv[2]
                });
var pdfs      = require('../../lib/pdfs');
var period    = now.getBillingPeriod();

var PROCESSING_LIMIT = 5;

logger.info( 'Processing billing period %s to %s', period.startDate, period.endDate );

function onRestaurant( restaurant, done ){
  var pms = PMS.create({
    restaurant_id:  restaurant.id
  , period_begin:   period.startDate
  , period_end:     period.endDate
  });

  pms.fetch( function( error ){
    if ( error && error.name !== 'NOT_FOUND' ){
      return done( error );
    }

    return pms.save( done );
  });
}

utils.async.waterfall([
  db.restaurants.find.bind( db.restaurants, {
    id: { $in: {
      type: 'select'
    , table: 'rorders'
    , columns: ['restaurant_id']
    } }

  , plan_id: { $notNull: true }
  }, {
    with: [
      { name:  'rorders'
      , table: 'orders'
      , type:  'select'
      , columns: ['restaurant_id']
      , joins: [
          { type: 'left', target: 'order_statuses', on: { order_id: '$orders.id$' } }
        ]
      , where: {
          'order_statuses.status': 'submitted'
        , datetime: period.getMosqlRangeQuery()
        }
      }
    ]
  })

, function( restaurants, next ){
    logger.info('Processing', restaurants.length, 'restaurants');
    utils.async.eachLimit( restaurants, PROCESSING_LIMIT, onRestaurant, next );
  }
], function( error ){
  if ( error ){
    logger.error('Error processing payment summaries', {
      error: error
    });

    throw error;
  }

  process.exit( error ? 1 : 0 );
});
