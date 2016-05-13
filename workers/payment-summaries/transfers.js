var config = require('../../config');
var loggly = require('loggly').createClient({
  token:      config.credentials['loggly.com'].token
, subdomain:  config.credentials['loggly.com'].subdomain
});
var db = require('../../db');
var utils = require('../../utils');
var logger = require('../../logger').create('Worker-Transfers');
var EnumStream = require('../../lib/enum-stream');
var PMS = require('../../public/js/app/stamps/payment-summaries/transfers');
var now = require('stamps/datetime')({
  datetime: process.argv.length < 3 ? new Date() : process.argv[2]
});

var period = now.getBillingPeriod();

var where = {
  'restaurants.direct_deposit': true
, 'payment_summaries.period_begin': { $gte: period.startDate }
, 'payment_summaries.period_end': { $lte: period.endDate }
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
    .mapAsync( ( pms, next )=> pms.transferToStripeAccount( pms.stripe_id, next ) )
    // Transfer from the stripe account to default bank account
    .mapAsync( ( pms, next )=> pms.transferToBankAccount( pms.stripe_id, next ) )
    .errorsAsync( ( error, next )=>{
      loggly.log( { error }, ['Worker-Transfers'], ()=> next() );
    })
    .errors( pms => process.stdout.write('x') )
    .forEach( pms => process.stdout.write('.') )
    .end( ()=> process.exit(0) );
});
