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
    // Filter out restaurants that do not ahve transfers enabled
    .filterAsync( ( restaurant, next )=>{
      utils.stripe.accounts.retrieve( restaurant.stripe_id, function( error, acct ){
        if ( error ){
          error.restaurant_id = restaurant.id;
          return next( error );
        }

        return next( null, !!acct.transfers_enabled );
      });
    })
    // Fetch full payment summary record
    .mapAsync( ( pms, next )=> PMS.fetch( next ) )
    // Transfer to the stripe account
    .mapAsync( ( pms, next )=>{
      var data = {
        amount: pms.getTotalPayout()
      , currency: 'usd'
      , destination: pms.stripe_id
      , description: 'Payment #' + pms.id
      };

      utils.stripe.transfers.create( data, ( error, result )=>{
        if ( error ){
          error.payment_summary_id = pms.id;
          return next( error );
        }

        return next( null, pms );
      });
    })
    // Transfer from the stripe account to default bank account
    .mapAsync( ( pms, next )=>{
      var data = {
        amount: pms.getTotalPayout()
      , currency: 'usd'
      , destination: 'default_for_currency'
      , description: 'Payment #' + pms.id
      };
    })
    .errorsAsync( ( error, next )=>{

    })
});
