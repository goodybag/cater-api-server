var CONCURRENCY = 10;

var invoices  = require('stamps/user-invoice');
var now       = require('stamps/datetime')();
var logger    = require('../../lib/logger').create('Worker-SendInvoices');

if ( !now.isFirstDayOfBillingPeriod() ){
  process.exit(0);
}

var period = now.getPreviousBillingPeriod();

db.user_invoices.findAysnc({
  status: 'pending'
, billing_period_begin: period.startDate
, billing_period_end:   period.endDate
})
.catch( function( error ){
  logger.
  throw error;
});
.map( function( invoice ){;
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