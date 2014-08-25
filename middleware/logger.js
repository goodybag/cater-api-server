var utils   = require('../utils');
var logger  = require('../lib/logger');

module.exports = function( options ){
  return function( req, res, next ){
    req.logger = logger.create( 'Request', {
      data: {
        req: {
          id:     utils.uuid()
        , params: req.params
        , url:    req.url
        }
      }
    });

    next();
  };
}