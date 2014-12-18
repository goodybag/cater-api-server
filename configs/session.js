/**
 * Config.Session
 */

var redis = require('./redis');

module.exports = {
  store:  {
    host:   redis.host
  , port:   redis.port
  , db:     redis.db
  , pass:   redis.pass
  , ttl:      14 * 24 * 60 * 60
  }
, secret:   'rainbow kittens'
};