var assert    = require('assert');
var moment    = require('moment-timezone');
var config    = require('../../config');
var welcomer  = require('../../lib/welcome-emailer');

describe ('Welcome Emailer', function(){
  it ('should state the time is valid', function(){
    var user = { attributes: {} };
    var validTime = moment().tz( config.welcome.timezone );

    validTime.set( 'hour', +config.welcome.beginTime.split(':')[0] );
    validTime.set( 'minute', +config.welcome.beginTime.split(':')[1] + 1 );

    assert.equal( welcomer.isValidTimeForUser( validTime, user ), true );
  });

  it ('should state the time is invalid', function(){
    var user = { attributes: {} };
    var invalidTime = moment().tz( config.welcome.timezone );

    invalidTime.set( 'hour', +config.welcome.beginTime.split(':')[0] - 1 );

    assert.equal( welcomer.isValidTimeForUser( invalidTime, user ), false );
  });

  it ('should return a valid result without passing in a time as first arg', function(){
    var user = { attributes: {} };
    var result = welcomer.isValidTimeForUser( user );

    assert.equal( typeof result === 'boolean', true );
  });

  it ('should state the day is valid', function(){
    var user = { attributes: {} };
    var validTime = moment().tz( config.welcome.timezone );

    validTime = validTime.day( config.welcome.days[0] );

    assert.equal( welcomer.isValidDayForUser( validTime, user ), true );
  });

  it ('should state the day is invalid', function(){
    var user = { attributes: {} };
    var invalidTime = moment().tz( config.welcome.timezone );

    invalidTime = invalidTime.day(0);

    assert.equal( welcomer.isValidDayForUser( invalidTime, user ), false );
  });

  it ('should return a valid result without passing in a date as first arg', function(){
    var user = { attributes: {} };
    var result = welcomer.isValidDayForUser( user );

    assert.equal( typeof result === 'boolean', true );
  });
});