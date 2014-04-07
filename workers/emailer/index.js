/**
 * Emailer worker
 */

var emailer = require('../../lib/emailer');
var db      = require('../../db');
var utils   = require('../../utils');
var logger  = require('../../logger').emailerWorker;

var job = new utils.CronJob({
  cronTime: '00 * * * * *'
, start:    true
, onTick:   onTick
});

var loggerTags = ['emailer-worker'];

[ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
  logger[ level ] = logger[ level ].bind( logger, loggerTags );
});

module.exports.onTick = function onTick(){
  logger.info('onTick');

  utils.async.waterfall([
    emailer.getReadyToSend.bind( emailer )

  , function( emails, next ){
      logger.info( 'Preparing to send emails', { emails: emails } );

      var onEmail = function( email, done ){
        emailer.send( email, function( error ){
          if ( error ){
            logger.warn( 'Error sending email', email );

          }
        });
      };

      utils.async.each( emails, onEmail, next );
    }
  ], function( error ){

  });
};