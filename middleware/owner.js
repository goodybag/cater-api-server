/**
 * Checks a parameter in the URL against a field on the user object
 * to ensure resource ownership. Sends a 401 if non-owner
 */

var utils = require('utils');

module.exports = function( options ){
  options = utils.defaults( options, {
    param:      'uid'
  , userField:  'id'
  });

  return function( req, res, next ){
    if ( !req.user ) return res.send( 401 );
    if ( req.user.groups.indexOf('admin') > -1 ) return next();
    if ( req.param( options.param ) == req.user[ options.userField ] ) return next();

    return res.send( 401 );
  };
};