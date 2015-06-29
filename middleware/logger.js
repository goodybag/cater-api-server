var config  = require('../config');
var utils   = require('../utils');
var logger  = require('../lib/logger').create('Requests');

module.exports = function( options ){
  return function( req, res, next ){
    var id = config.isProduction || config.isStaging ?
              req.headers['x-request-id'] : utils.uuid();

    req.logger = logger.create( 'Request', {
      data: {
        req: {
          id:     id
        , params: req.params
        , url:    req.url
        , body:   req.body
        }
      }
    });

    next();
  };
}