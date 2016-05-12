var config = require('../../config');
var db = require('../../db');
var utils = require('../../utils');
var logger = require('../../logger').create('Worker-Transfers');
var EnumStream = require('../../lib/enum-stream');
var PMS = require('../../public/js/app/stamps/payment-summaries');
var now = require('stamps/datetime')({
  datetime: process.argv.length < 3 ? new Date() : process.argv[2]
});

var period = now.getBillingPeriod();

var where = {
  'restaurants.direct_deposit': true
,
};

var options = {
  joins:  [ { type: 'left'
            , target: 'restaurants'
            , on: { 'payment_summaries.restaurant_id': '$restaurants.id$' }
            }
          ]
};

db.payment_summaries.findStream( where, options, ( error, resultStream )=>{
  if ( error ){
    throw error;
  }

  EnumStream
    .create( resultStream, { concurrency: 10 } )
    .filterAsync( ( restaurant, next )=>{
      utils.stripe.accounts.retrieve( restaurant.stripe_id, function( error, acct ){
        if ( error ){
          error.restaurant_id = restaurant.id;
          return next( error );
        }

        return next( null, !!acct.transfers_enabled );
      });
    })
    .mapAsync( ( pms, next )=> PMS.fetch( next ) )
    .mapAsync( ( pms, next )=>{
      utils.stripe.transfers.create
    })
    .errorsAsync( ( error, next )=>{

    })
});
