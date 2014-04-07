/**
 * Emailer
 *
 * Adds an email to the email queue
 */

var db      = require('../db');
var errors  = require('../errors');
var utils   = require('../utils');
var logger  = reuqire('../logger').emailer;

var loggerTags = ['emailer'];

[ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
  logger[ level ] = logger[ level ].bind( logger, loggerTags );
});

module.exports.enqueue = function( email, callback ){
  db.emails.insert( email, callback );
};

module.exports.send = utils.overload({
  default: function(){
    throw new Error('Invalid argument combination');
  }


, 'Number,Function':
  function( id, callback ){
    db.emails.findOne( id, function( error, email ){
      if ( error ) return callback( error );

      if ( !email ) return callback( errors.internal.NOT_FOUND );

      return module.exports.send( email, callback );
    });
  }

, 'Object,Function':
  function( email, callback ){
    utils.sendMail2( email, function( error ){
      // Need to update the email object with error status and log
      if ( error ){
        logger.error( 'Error sending email', {
          email: email
        , error: error
        });

        return db.emails.update( email.id, updates, function( updateError ){
          if ( updateError ){
            logger.error( 'Error updating email object with error status', {
              email:        email
            , emailError:   error
            , updateError:  updateError
            });
          }

          callback( error );
        });
      }

      logger.info('Email send success!', { emailId: email.id });

      callback();
    });
  }
});

/**
 * Gets emails that are ready to be sent rite nao
 * @param  {Function} callback callback( error, eamils )
 */
module.exports.getReadyToSend = function( callback ){
  var where = {
    status:     'pending'
  , send_date: { $is_future: false }
  };

  var options = {
    limit: 'all'
  , order: { send_date: 'asc' }
  };

  db.emails.find( where, options, callback );
};