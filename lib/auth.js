var db        = require('../db');
var queries   = require('../db/queries')
var utils     = require('../utils');
var errors    = require('../errors')
var alogger   = require('./logger');

module.exports = function( email, password, callback ){
  var logger = alogger.create('Auth', {
    data: { email: email }
  });

  logger.info('Attempting to auth');

  if (typeof password !== 'string'){
    logger.info('Password was not a string, sending error');
    return callback( errors.auth.INVALID_PASSWORD );
  }

  var query = queries.user.get({
    email: { $custom: [ 'lower(email) = lower($1)', email ] }
  });

  var sql = db.builder.sql( query );

  db.query( sql.query, sql.values, function( error, results ){
    if ( error ){
      logger.error( 'Error querying the database', error );
      return callback( error );
    }

    if ( results.length === 0 ){
      logger.info('No results returned. Invalid email');
      return callback( errors.auth.INVALID_EMAIL );
    }

    var user = results[0];

    logger.info( 'Comparing passwords for user', user.id, { user: user } );
    utils.comparePasswords( password, user.password, function( error, success ){
      if ( !success ){
        logger.warn('Invalid password!');
        return callback( errors.auth.INVALID_EMAIL );
      }

      return callback( null, user );
    });
  });
};