/**
 * Welcome Email
 *
 * Description:
 *   If there are any pending users that have not been welcomed,
 *   and if it's within the send timeframe, welcome them!
 */

var Models  = require('../../../models');
var utils   = require('../../../utils');
var config  = require('../../../config');
var views   = require('../lib/views');
var helpers = require('../../../public/js/lib/hb-helpers');
var welcome = require('../../../lib/welcome-emailer');
var moment  = require('moment-timezone');

module.exports.name = 'Welcome Email';

module.exports.schema = config.welcome.reminderSchema;

module.exports.getUsers = function( callback ){
  welcome.getUnWelcomedUsers( function( error, users ){
    if ( error ) return callback( error );

    // Assume that in the future, we'll be able to associate
    // users to specific timezone
    users.forEach( function( user ){
      user.attributes.timezone = config.welcome.timezone;
    });

    // Ensure the current time for each user in the list is
    // within the acceptable timeframe to be sending emails
    users = users.filter( function( user, i, a ){
      return welcome.isValidTimeForUser( user );
    });

    return callback( null, users );
  });
};

module.exports.check = function( storage, callback ){
  module.exports.getUsers( function( error, users ){
    if ( error ) return callback( error );
    return callback( null, users.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    errors:               { text: 'Errors', value: 0, objects: [] }
  , usersWelcomed:        { text: 'Users Welcomed', value: 0 }
  };

  module.exports.getUsers( function( error, users ){
    if ( error ) return callback( error );

    utils.async.each( users, function( user, done ){
      welcome.send( user, function( error ){
        if ( error ){
          stats.errors.value++;
          stats.errors.objects.push( error );
          return done();
        }

        stats.usersWelcomed.value++;
        done();
      });
    }, callback.bind( null, null, stats ));
  });
};