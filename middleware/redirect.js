/**
 * Redirect
 */

var utils = require('../utils');

module.exports = function( _url, options ){
  options = utils.defaults( options || {}, {

  });

  return function( req, res, next ){
    var url = _url;

    req.route.keys.forEach( function( key ){
      url = url.replace( new RegExp( ':' + key.name, 'g' ), req.param( key.name ) )
    });

    res.redirect( url );
  };
};