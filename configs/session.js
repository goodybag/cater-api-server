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
  }
, secret:   'rainbow kittens'
, resave:   false
, maxAge:   14 * 24 * 60 * 60 * 1000
, saveUninitialized: true
};