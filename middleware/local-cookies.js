/**
*  Attach local cookies to response object
*  @param {Array} - cookies - array of keys of type string
*
*  usage:
*	  m.localCookies(['gb_display', 'my_cookie_name'])
*/

module.exports = function ( cookies ) {
  return function ( req, res, next ) {
    res.locals.cookies = {};
    cookies.forEach( function ( key ) {
      res.locals.cookies[ key ] = req.cookies[ key ];
    });
    next();
  }
};
