/**
 * Sets the user on session and cookie expiration
 */

var utils = require('../utils');

module.exports = function( options ){
  return function( req, res, next ){
    req.setSession = function( user, remember ){
      req.session.user = user;

      // remember me triggered by /login
      // expire in two weeks of inactivity
      if ( remember ) {
        req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000;
      }
    };

    next();
  }
}