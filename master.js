var forky = require('forky');
var config = require('./config');

forky( __dirname + '/server', config.numWorkers );

if ( config.isDev ){
  process.on('uncaughtException', function( error ){
    logger.error( error );
    console.error( error, error.stack );
  });

  require('./workers/scheduler');
}