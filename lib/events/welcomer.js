/**
 * Events:Welcomer
 */

var moment    = require('moment-timezone');
var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');
var welcome   = require('../welcome-emailer');

module.exports = {
  // Send welcome email
  'user:registered':
  function( user ){
    if ( !config.welcome.isEnabled ) return;

    var logger = this.logger;

    var time  = new moment().tz( user.attributes.timezone || config.welcome.timezone );
    var min   = new moment().tz( user.attributes.timezone || config.welcome.timezone );
    var max   = new moment().tz( user.attributes.timezone || config.welcome.timezone );

    min.set( 'hour', +config.welcome.beginTime.split(':')[0] );
    min.set( 'minute', +config.welcome.beginTime.split(':')[1] );
    max.set( 'hour', +config.welcome.endTime.split(':')[0] );
    max.set( 'minute', +config.welcome.endTime.split(':')[1] );

    logger.info('Times', {
      time: time
    , min: min
    , max: max
    });

    if ( time < min ){
      time.set( 'hour', min.get('hour') );
      time.set( 'minute', min.get('minute') );

    // We need to advance the day by 1 and set the hh:mm since
    // the time has already passed
    // If this is a Friday, the day becomes Saturday, which will
    // fail the `isValidDay` check, then the day will be set to Monday
    } else if ( time > max ){
      time.add( 'days', 1 );
      time.set( 'hour', min.get('hour') );
      time.set( 'minute', min.get('minute') );
    } else {
      time.add( 'millisecond', config.welcome.delay );
    }

    if ( !welcome.isValidDayForUser( time, user ) ){
      time = time.day( config.welcome.days[0] );
    }

    scheduler.enqueue( 'send-welcome-email', time.tz('UTC').toDate(), {
      user:       user.toJSON()
    , options: {
        from:     config.welcome.from
      , subject:  config.welcome.subject
      , template: config.welcome.template
      }
    });
  }
};