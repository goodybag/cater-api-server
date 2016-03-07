/**
 * Send JSON
 */

var utils = require('../utils');

module.exports = function( path ){
  return function( req, res ){
    var reqRes = { req: req, res: res };
    var result = utils.getProperty( reqRes, path );
    res.json( result );
  };
};