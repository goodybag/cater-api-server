/**
 * Emailer worker
 */

var config  = require('../../config');
var emailer = require('../../lib/emailer');
var db      = require('../../db');
var utils   = require('../../utils');
var logger  = require('../../logger').emailerWorker;

var loggerTags = ['emailer-worker'];

[ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
  logger[ level ] = logger[ level ].bind( logger, loggerTags );
});

logger.info('Starting emailer worker');

module.exports.onTick = function (){
  logger.info('onTick');

  utils.async.waterfall([
    emailer.getReadyToSend.bind( emailer )

  , function( emails, next ){
      var onEmail = function( email, done ){
        logger.info( 'Preparing to email', { email: email } );

        emailer.send( email, function( error ){
          if ( error ){
            logger.warn( 'Error sending email', email );
          }

          next();
        });
      };

      utils.async.each( emails, onEmail, next );
    }
  ], function( error ){
    // We don't send error in loop, so this realllly shouldn't happen, but log it
    if ( error ){
      logger.error( 'Error sending emails', error );
    }
  });
};

var job = new utils.CronJob({
  cronTime: config.emailer.cronTime
, start:    true
, onTick:   module.exports.onTick
});