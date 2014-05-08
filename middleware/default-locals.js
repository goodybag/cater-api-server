var utils = require('../utils');
/**
 * Default any objects to res.locals object
 *
 * @param {string} active tab
 */
module.exports = function( obj ){
  return function( req, res, next ){
    if ( typeof obj !== 'object' ) {
      return res.send(500);
    }
    utils.defaults(res.locals, obj);
    next();
  };
};