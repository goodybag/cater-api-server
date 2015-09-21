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

        pdfs.pms.get( { id: this.id }, function( error, res ){
          if ( error ) return callback( error );

          utils.sendMail2({
            to:       recipients
          , from:     config.paymentSummaries.fromMail
          , subject:  'Goodybag Payment Summary #' + this.id

          , body: [ 'Hi'
                  , '\n\n'
                  , 'Attached is invoice #:id for billing period :billing_period '
                  , 'for orders placed through Goodybag.com.'
                  , '\n\n'
                  , 'Checks should be made out to: :legal_name\n'
                  , 'Mailed to: :legal_address'
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
                  .replace( ':legal_name', config.legal.name )
                  .replace( ':legal_address', Address( config.legal.mailingAddress ).toString() )

          , attachment: {
              fileName:     config.paymentSummaries.fileName.replace( ':psdid', this.id )
            , streamSource: res
            }
          }, function( error ){
            if ( error ) return callback( error );

            this.status = 'emailed';
            this.email_sent_date = new Date();

            this.save( callback );
          }.bind( this ));
        }.bind( this ));
      }.bind( this ));

      return this;
    }
  });
