var CONCURRENCY = 10;

var Promise   = require('bluebird');
var db        = require('db');
var invoices  = require('stamps/user-invoice');
var now       = require('stamps/datetime')();
var logger    = require('../../lib/logger').create('Worker-SendInvoices');

if ( !now.isStartOfBillingPeriod() ){
  console.log('not first day');
  process.exit(0);
}

var errors = [];

var period = now.getPreviousBillingPeriod();

logger.info( 'Processing billing period %s to %s', period.startDate, period.endDate );

db.user_invoices.findAsync({
  status: 'pending'
, billing_period_start: { $gte: period.startDate }
, billing_period_end:   { $lte: period.endDate }
})
.catch( function( error ){
  console.log('error', error);
  logger.error({ error: error });
  process.exit(1);
})
.then( function( invoices ){
  console.log(invoices);
  return Promise.resolve( invoices );
})
.map( function( invoice ){;
  console.log('sending', invoice.id)
  return invoices.create( invoice )
    .sendEmailAsync()
    .error( function( error ){
      errors.push( error );
    });
}, { concurrency: CONCURRENCY })
.then( function(){
  if ( errors.length ){
    logger.error('Invoice sending had errors', {
      errors: errors
    });
  }

  process.exit(0);
});