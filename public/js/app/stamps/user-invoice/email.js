var utils   = require('utils');
var config  = require('config');
var pdfs    = require('../../../../../lib/pdfs');

module.exports = require('stampit')()
  .state({

  })
  .methods({
    sendEmail: function( callback ){

      // No user record, go ahead and run a fetch
      if ( !this.user ){
        return this.fetch( function( error ){
          if ( error ) return callback( error );

          this.sendEmail( callback );
        }.bind( this ));
      }

      // Set email to passed in email (if exists) or default email on user
      var email = this.email || this.user.email;

      pdfs.invoice.get( { id: this.id }, function( error, res ){
        if ( error ) return callback( error );

        utils.sendMail2({
          to:       email
        , from:     config.invoice.fromMail
        , subject:  'Goodybag Invoice #' + this.id

        , body: ['Attached is the invoice for billing period '
                , this.getBillingPeriodFormatted(), '.'
                , '\n\n'
                , 'This is an automated message, but feel free '
                , 'to reply if you have any questions. '
                , 'Thank you and have a fantastic day!'
                , '\n\n'
                , '-Goodybot'
                ].join('')

        , attachment: {
            fileName:     config.invoice.fileFormat.replace( ':id', this.id )
          , streamSource: res
          }
        }, function( error ){
          if ( error ) return callback( error );

          this.status = 'emailed';
          this.email_sent_date = new Date();

          this.save( callback );
        }.bind( this ));
      }.bind( this ));

      return this;
    }
  });
