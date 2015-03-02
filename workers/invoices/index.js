var now = require('stamps/datetime')();

if ( !now.isFirstOfMonth() && !now.isMiddleOfMonth() ){
  process.exit(1);
}

var db        = require('db');
var utils     = require('utils');
var invoices  = require('stamps/user-invoice');
var logger    = require('../../lib/logger').create('Worker-Invoices');

utils.async.waterfall([
  db.users.find.bind( db.users, { is_invoiced: true } )

, function( users, next ){
    logger.info('Processing', users.length, 'users');

    utils.async.each( users, function( user, done ){
      var invoice = invoices.create({
        user_id
      });
    }, next );
  }
]);