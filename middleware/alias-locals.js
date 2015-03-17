/**
 * Alias Locals
 */

module.exports = function( aliases ){
  return function( req, res, next ){
    for ( var key in aliases ){
      res.locals[ key ] = res.locals[ aliases[ key ] ];
    }

    return next();
  };
};