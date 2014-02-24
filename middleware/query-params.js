/**
 * Set query param object on locals
 */

module.exports = function( options ){
  return function( req, res, next ){
    res.locals.query = req.query;
    next();
  }
};