/**
 * Config.Redis
 */

// default
module.exports = {
  host: 'localhost'
, port: 6379
, db:   '0'
};

var url = require('url');
var parse = function( connStr ){
  var parsed = url.parse( connStr, true, true );

  var options = {
    hostname: parsed.hostname
  , port:     parsed.port
  , db:       ( parsed.pathname || '/' ).slice(1) || '0'
  };

  if ( parsed.auth ){
    options.pass = ( parsed.auth || '' ).split(':')[1];
  }

  return options;
};

var envs = [ 'production', 'staging', 'india' ];

if ( envs.indexOf( process.env['GB_ENV'] ) > -1 ){
  module.exports = parse( proces.env['REDISCLOUD_URL'] );
}
