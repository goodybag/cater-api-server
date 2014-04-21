/**
 * Declare active tab for navbars like
 * admin panel
 *
 * @param {string} active tab
 */
module.exports = function( tab ){
  return function( req, res, next ){
    if ( typeof tab !== 'string' ) {
      return res.send(500);
    }
    res.locals.active_tab = tab;
    next();
  };
};