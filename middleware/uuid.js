
/**
 * Module Dependencies
 */

var
  uuid = require('node-uuid')
;

/**
 * Append a uuid to the request object
 * @return {Function} express middleware that appends the uuid to the req
 */
module.exports = function(){
  return function(req, res, next){
    req.uuid = uuid.v1();
    next();
  }
};
