/**
 * Query Options
 *
 * Embeds values from options into req.queryOptions
 */

var utils     = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options, {

  });

  return function( req, res, next ){
    for ( var key in options ){
      req.queryOptions[ key ] = options[ key ];
    }

    return next();
  };
};