/**
 * Sets the user on session
 */

var utils = require('../utils');

module.exports = function( options ){
  return function( req, res, next ){
    req.setSession = function( user ){
      req.session = utils.extend(
        {}, req.session
      , { user: utils.pick( user, [ 'id', 'name', 'organization', 'groups', 'email', 'created_at' ] ) }
      );
    };

    next();
  }
}