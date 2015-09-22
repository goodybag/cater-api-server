var db      = require('db');
var utils   = require('utils');
var config  = require('config');
var pdfs    = require('../../../../../lib/pdfs');
var Address = require('stamps/addresses');

module.exports = require('stampit')()
  .state({

  })
  .methods({
    sendEmail: function( callback ){
      this.fetchRecipients( function( error, recipients ){
        if ( error ) return callback( error );

        var where = { id: this.id, restaurant_id: this.restaurant_id };

        pdfs.pms.get( where, function( error, res ){
          if ( error ) return callback( error );

          utils.sendMail2({
            to:       recipients
          , from:     config.paymentSummaries.fromEmail
          , subject:  'Goodybag Payment Summary #' + this.id

          , body: [ 'Hi'
                  , '\n\n'
                  , 'Attached is payment summary #:id for billing period :billing_period '
                  , 'for orders placed through Goodybag.com.'
                  , '\n\n'
                  , 'This is an automated message, but feel free to reply to this '
                  , 'email if you have any questions.'
                  , '\n\n'
                  , 'Thanks a bunch!'
                  , '\n\n'
                  , '-Goodybot'
                  ].join('')
                  .replace( ':id', this.id )
                  .replace( ':billing_period', this.getBillingPeriodFormatted() )

          , attachment: {
              fileName:     config.paymentSummaries.fileName.replace( ':psdid', this.id )
            , streamSource: res
            }
          }, callback );
        }.bind( this ));
      }.bind( this ));

      return this;
    }
  });
