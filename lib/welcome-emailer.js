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

    module.exports.sendEmail1( user, callback );
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

module.exports.isValidTimeForUser = function( now, user ){
  if ( typeof now === 'object' && !moment.isMoment( now ) ){
    user = now;
    now = null;
  }

  if ( !user.attributes.timezone ){
    user.attributes.timezone = config.welcome.timezone;
  }

  now       = now || moment().tz( user.attributes.timezone );
  var begin = moment().tz( user.attributes.timezone );
  var end   = moment().tz( user.attributes.timezone );

  begin.set( 'hour',    okTimeRanges.beginHour );
  begin.set( 'minute',  okTimeRanges.beginMinute );

  end.set( 'hour',    okTimeRanges.endHour );
  end.set( 'minute',  okTimeRanges.endMinute );

  return begin <= now && now < end;
};

module.exports.isValidDayForUser = function( now, user ){
  if ( typeof now === 'object' && !moment.isMoment( now ) ){
    user = now;
    now = null;
  }

  if ( !user.attributes.timezone ){
    user.attributes.timezone = config.welcome.timezone;
  }

  now = now || moment().tz( user.attributes.timezone );


  return config.welcome.days.indexOf( now.day() ) > -1;
};