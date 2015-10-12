/**
 * Checks a parameter in the URL against a field on the user object
 * to ensure resource ownership. Sends a 401 if non-owner
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    param:      'uid'
  , userField:  'id'
  , onError: function( req, res, next ){
      // If they're not logged in, redirect them to login
      if ( req.user.isGuest() )
      if ( 'accept' in req.headers )
      if ( req.headers.accept.split(',').indexOf('text/html') > -1 ){
        return res.redirect( '/login?next=' + req.originalUrl );
      }
      return res.send(401);
    }
  });

  return function( req, res, next ){
    if ( !req.user ) return options.onError( req, res, next );

    if ( req.user.attributes.groups.indexOf('admin') > -1 ) return next();
    if ( req.params[options.param] == req.user.attributes[ options.userField ] ) return next();

    return options.onError( req, res, next );
  };
};
