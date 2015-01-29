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

    var clone = utils.deepClone( options );

    for ( var key in options ){
      req.queryOptions[ key ] = clone[ key ];
    }

    return next();
  };
};