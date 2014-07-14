var config = require('./config');
var forky = require('forky');
forky(__dirname + '/server', config.numWorkers);

if ( config.isDev ){
  process.on('uncaughtException', function( error ){
    console.error( error, error.stack );
  });

  require('./workers/scheduler');
}