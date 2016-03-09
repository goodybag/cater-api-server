var db        = require('db');
var utils     = require('utils');
var helpers   = require('../../../public/js/lib/hb-helpers');
var PMS       = require('stamps/payment-summaries/db');
var now       = require('stamps/datetime')({
                  datetime: process.argv.length < 3 ? new Date() : process.argv[2]
                });
var period    = now.getBillingPeriod();

module.exports.name = 'send-payment-summaries-total-payout';

module.exports.fn = function( job, done ){
  var where = {
    period_begin: { $gte: job.data.period_begin }
  , period_end: { $lte: job.data.period_end }
  };

  function onPaymentSummary( total, item, next ){
    PMS
      .create( item )
      .fetch( function( error, pms ){
        if ( error ){
          return next( error );
        }

        next( null, total + pms.getTotalPayout() );
      });
  }

  db.payment_summaries.find( where, function( error, results ){
    utils.async.reduce( results, 0, onPaymentSummary, function( error, total ){
      if ( error ){
        return done( error );
      }

      var totalDollars = helpers.dollars( total );

      utils.sendMail2({
        to: job.data.recipient
      , from: 'pms@goodybag.com'
      , subject: `Payment Summaries Total Payout ${job.data.period_begin} - ${job.data.period_end}`
      , html: `
<p>Total for billing period ${job.data.period_begin} - ${job.data.period_end}</p>
<p>Total: $${totalDollars}</p>
`
      }, done );
    });
  });
};