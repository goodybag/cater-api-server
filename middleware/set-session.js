/**
 * Sets the user on session and cookie expiration
 */

var utils = require('../utils');

module.exports = function( options ){
  return function( req, res, next ){

    // Expire in two weeks of inactivity
    if ( req.session.remember )
      req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000;

    req.setSession = function( user, remember ){
      utils.extend(
        req.session
      , { user: utils.pick( user, [ 'id', 'name', 'organization', 'groups', 'email', 'points', 'created_at' ] ) }
      );

      // Remember me checked, triggered by /login
      if ( remember )
        req.session.remember = remember;
    };

    next();
  }
}