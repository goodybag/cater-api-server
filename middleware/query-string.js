/**
 * Set query param string on locals
 */

module.exports = function( options ){
  return function( req, res, next ){
    res.locals.query = '?' + utils.invoke(utils.pairs(req.query), 'join', '=').join('&');
    next();
  }
};