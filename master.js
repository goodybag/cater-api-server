var config = require('./config');
var forky = require('forky');
forky(__dirname + '/server');

if ( config.isDev ){
  process.on('uncaughtException', function( error ){
    console.error( error, error.stack );
  });

  require('./workers/scheduler');
}