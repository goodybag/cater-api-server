/**
 * Welcome Emailer
 */

var utils     = require('../utils');
var db        = require('../db');
var Models    = require('../models');
var config    = require('../config');
var app       = require('../app');
var logger    = require('../logger').welcomeEmail;
var reminder  = require('../workers/reminder/lib/reminder');
var moment    = require('moment-timezone');

var okTimeRanges = {
  beginHour:    +config.welcome.beginTime.split(':')[0]
, beginMinute:  +config.welcome.beginTime.split(':')[1]
, endHour:      +config.welcome.endTime.split(':')[0]
, endMinute:    +config.welcome.endTime.split(':')[1]
};

module.exports.send = utils.overload({
  'User,Function':
  function( user, callback ){
    var options = {
      layout: 'emails/layout'
    , user:   user.toJSON()
    };

    logger.info( 'Preparing welcome email for user', user.toJSON() );

    utils.async.series([
      module.exports.markUserAsWelcomed.bind( null, user.attributes.id )
    , function( next ){ setTimeout( next, config.welcome.delay1 ) }
    , module.exports.sendEmail1.bind( null, user )
    // , function( next ){ setTimeout( next, config.welcome.delay2 ) }
    // , module.exports.sendEmail2.bind( null, user )
    ], callback );
  }

, 'Number,Function':
  function( userId, callback ){
    Models.User.findOne({ where: { id: userId } }, function( error, user ){
      if ( error ) return callback( error );

      return module.exports.send( user, callback );
    });
  }

, default: function(){
    throw new Error('welcomer.send - Must supply a User/userId and a callback');
  }
});

module.exports.sendEmail1 = function( user, callback ){
  var options = {
    layout: 'emails/welcome-layout'
  , user:   user.toJSON()
  };

  app.render( 'emails/welcome-1', options, function( error, html ){
    if ( error ){
      logger.error( 'Error rendering welcome email template', error )
      return callback( error );
    }

    utils.sendMail2({
      to:       user.attributes.email
    , from:     config.welcome.from
    , subject:  config.welcome.subject1
    , html:     html
    }, function( error ){
      if ( error ){
        logger.error( 'Error sending welcome 1 email', error );
      }

      return callback( error );
    });
  });
};

module.exports.sendEmail2 = function( user, callback ){
  var options = {
    layout: 'emails/welcome-layout'
  , user:   user.toJSON()
  };

  app.render( 'emails/welcome-2', options, function( error, html ){
    if ( error ){
      logger.error( 'Error rendering welcome email template', error )
      return callback( error );
    }

    utils.sendMail2({
      to:       user.attributes.email
    , from:     config.welcome.from
    , subject:  config.welcome.subject2
    , html:     html
    }, function( error ){
      if ( error ){
        logger.error( 'Error sending welcome 2 email', error );
      }

      return callback( error );
    });
  });
};

module.exports.hasWelcomedUser = function( userId, callback ){
  throw new Error('TODO: Implement this');
};

module.exports.markUserAsWelcomed = function( userId, callback ){
  var reminderName = 'Welcome Email';

  Models.Reminder.findOne({
    where: { name: reminderName }
  }, function( error, result ){
    if ( error ){
      logger.error( 'Error fetching reminders in `markUserAsWelcomed` for userId: ' + userId, error );
      return callback ? callback( error ) : null;
    }

    if ( result && result.attributes && result.attributes.data ){
      result = result.attributes.data;
    } else {
      result = {};
    }

    reminder.ensureSchema( config.welcome.reminderSchema, result );

    result.users[ userId ] = true;

    reminder.saveStorage( reminderName, result, callback );
  });
};

module.exports.getUnWelcomedUsers = utils.overload({
  'Function':
  function( callback ){
    return module.exports.getUnWelcomedUsers( {}, callback );
  }

, 'Object,Function':
  function( query, callback ){
    query.where = query.where || {};
    query.where['id::text'] = query.where['id::text'] || {};

    query.where['id::text'].$nin = {
      type: 'select'
    , table: 'reminders'
    , columns: [{
        type: 'json_object_keys'
      , expression: 'data->\'users\''
      }]
    , where: {
        name: 'Welcome Email'
      }
    };

    Models.User.find( query, function( error, users ){
      if ( error ) return callback( error );

      return callback( null, users );
    });
  }

, default: function(){
    throw new Error('welcomer.getUnWelcomedUsers - Must supply a callback');
  }
});

module.exports.isValidTimeForUser = function( user ){
  if ( !user.attributes.timezone ){
    user.attributes.timezone = config.welcome.timezone;
  }

  var now   = moment().tz( user.attributes.timezone );
  var begin = moment().tz( user.attributes.timezone );
  var end   = moment().tz( user.attributes.timezone );

  begin.set( 'hour',    okTimeRanges.beginHour );
  begin.set( 'minute',  okTimeRanges.beginMinute );

  end.set( 'hour',    okTimeRanges.endHour );
  end.set( 'minute',  okTimeRanges.endMinute );

  return begin <= now && now < end;
};