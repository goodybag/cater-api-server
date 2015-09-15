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

  var $where = {
    email: { $custom: [ 'lower(email) = lower($1)', email ] },
    is_deleted: false
  };

  var options = {
    many: [ { table: 'users_groups', alias: 'groups' }
          , { table: 'addresses' }
          ]
  };

  db.users.findOne( $where, options, function( error, user ){
    if ( error ){
      logger.error( 'Error querying the database', error );
      return callback( error );
    }

    if ( !user ){
      logger.info('No results returned. Invalid email');
      return callback( errors.auth.INVALID_EMAIL );
    }

    logger.info( 'Comparing passwords for user', user.id, { user: user } );
    utils.comparePasswords( password, user.password, function( error, success ){
      if ( !success ){
        logger.warn('Invalid password!');
        return callback( errors.auth.INVALID_EMAIL );
      }

      user.groups = utils.pluck( user.groups, 'group' );

      return callback( null, user );
    });
  });
};
