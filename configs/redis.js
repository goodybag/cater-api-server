/**
 * Config.Redis
 */

// default
module.exports = {
  host: 'localhost'
, port: 6379
, db:   0
};

var url = require('url');

// Parse a connection string redis url
// inspired from:
//   https://github.com/ddollar/redis-url/blob/master/index.js
//   https://github.com/mranney/node_redis/pull/658/files
var parse = function( connStr ){
  var parsed = url.parse( connStr, true, true );

  var options = {
    hostname: parsed.hostname
  , port:     parsed.port
  , db:       +( parsed.pathname || '/' ).slice(1) || 0
  };

  if ( parsed.auth ){
    options.auth_pass = ( parsed.auth || '' ).split(':')[1];
  }

  return options;
};

var envs = [ 'production', 'staging', 'india' ];

if ( envs.indexOf( process.env['GB_ENV'] ) > -1 )
if ( typeof process.env['REDISCLOUD_URL'] === 'string' ){
  module.exports = parse( process.env['REDISCLOUD_URL'] );
}
