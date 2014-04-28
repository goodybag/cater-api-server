var assert    = require('assert');
var welcomer  = require('../../lib/welcome-emailer');

describe ('Welcome Emailer', function(){
  it ('should state whether the time is valid', function(){
    var user = { attributes: {} };
    welcomer.isValidTimeForUser( user );
  });
});