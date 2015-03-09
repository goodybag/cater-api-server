var Promise   = require('bluebird');
var db        = require('db');
var utils     = require('utils');
var invoices  = require('stamps/user-invoice');
var logger    = require('../../lib/logger').create('Worker-Invoices');
var now       = require('stamps/datetime')();
var period    = now.getBillingPeriod();

logger.info( 'Processing billing period %s to %s', period.startDate, period.endDate );

utils.async.waterfall([
  db.users.find.bind( db.users, {
    is_invoiced: true
  , id: { $in: {
      type: 'select'
    , table: 'uorders'
    , columns: ['user_id']
    } }
  }, {
    with: [
      { name:  'uorders'
      , table: 'orders'
      , type:  'select'
      , columns: ['user_id']
      , where: {
          status: 'accepted'
        , datetime: {
            $gte: period.startDate
          , $lt:  period.endDate
          }
        , payment_method_id: { $null: true }
        }
      }
    ]
  })

, function( users, next ){
    logger.info('Processing', users.length, 'users');

    var pusers = users.map( function( user ){
      var invoice = invoices({ user_id: user.id }).billing( period );

      return invoice.fetchAsync()
        .then( function(){
          return invoice.populateOrdersBasedOnDateAsync();
        })
        .then( function(){
          return invoice.saveAsync();
        })
    });

    Promise.all( pusers )
      .then( next )
      .catch( next );
  }
], function( error ){
  process.exit( error ? 1 : 0 )
});