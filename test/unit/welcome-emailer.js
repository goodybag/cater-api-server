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
});