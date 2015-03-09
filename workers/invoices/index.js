var db        = require('db');
var utils     = require('utils');
var invoices  = require('stamps/user-invoice');
var logger    = require('../../lib/logger').create('Worker-Invoices');
var now       = require('stamps/datetime')();
var period    = now.getBillingPeriod();

logger.info( 'Processing billing period % to %', period.startDate, period.endDate );

utils.async.waterfall([
  db.users.find.bind( db.users, { is_invoiced: true } )

, function( users, next ){
    logger.info('Processing', users.length, 'users');

    utils.async.each( users, function( user, done ){
      var invoice = invoices({ user_id: user.id }).billing( period );

      invoice.fetch()
        .error( done )
        .then( invoice.populateOrdersBasedOnDate )
        .then( invoice.save );
    }, next );
  }
]);