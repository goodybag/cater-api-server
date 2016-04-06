var CONCURRENCY = 5;

var Promise   = require('bluebird');
var db        = require('../../db');
var invoices  = require('stamps/user-invoice');
var now       = require('stamps/datetime')();
var logger    = require('../../lib/logger').create('Worker-SendInvoices');

if ( !now.isStartOfBillingPeriod() ){
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
  logger.error({ error: error });
  process.exit(1);
})
.then( function( invoices ){
  logger.info( 'Processing %s invoices', invoices.length );
  return Promise.resolve( invoices );
})
.map( function( invoice ){;
  return invoices.create( invoice )
    .sendEmailAsync()
    .error( function( error ){
      errors.push({
        invoice:  invoice
      , error:    error
      });

      invoice.status = 'error';

      return invoice.saveAsync();
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