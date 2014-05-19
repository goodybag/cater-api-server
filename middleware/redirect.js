/**
 * Redirect
 */

var utils     = require('../utils');

module.exports = function( url, options ){
  options = utils.defaults( options || {}, {

  });

  return function( req, res, next ){
    req.route.keys.forEach( function( key ){
      url = url.replace( new RegExp( ':' + key.name, 'g' ), req.param( key.name ) )
    });

    res.redirect( url );
  };
};