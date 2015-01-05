/**
 * Redirect
 */

var utils = require('../utils');

module.exports = function( _url, options ){
  options = utils.defaults( options || {}, {

  });

  return function( req, res, next ){
    var url = _url;

    Object.keys(req.params).forEach( function( key ){
      url = url.replace( new RegExp( ':' + key, 'g' ), req.params[key] );
    });

    res.redirect( url );
  };
};
