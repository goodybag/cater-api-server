/*
* Rate limit application requests
*/

var Limiter = require('ratelimiter');
var redis = require('redis');
var config = require('../config');
var utils = require('../utils');

function getKey (req) {
  return req.connection.remoteAddress;
}

/**
* options:
*   max:      max # of requests
*   duration: time limit interval
*
*  The default request/duration is 100 requests per minute.
*/
module.exports = function( options ){

  return function( req, res, next ){

    options = Object.assign({}, {
      id: getKey(req)
    , db: redis.createClient( config.redis.port, config.redis.hostname, config.redis )
    , max: 100
    , duration: 1000 * 60 // 1 minute
    }, options);

    var limiter = new Limiter(options);

    limiter.get(function (error, limit) {
      if (error) {
        return next(error);
      }

      res.set('X-RateLimit-Limit', limit.total);
      res.set('X-RateLimit-Remaining', limit.remaining - 1);
      res.set('X-RateLimit-Reset', limit.reset);

      if (limit.remaining) return next();

      var delta = (limit.reset * 1000) - Date.now() | 0;
      var after = limit.reset - (Date.now() / 1000) | 0;
      res.set('Retry-After', after);
      res.status(429).render('429');

    });
  }
};
