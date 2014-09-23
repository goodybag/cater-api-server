var forky = require('forky');
var config = require('./config');
var logger = require('./lib/logger').create('Master');

logger.info( 'Forking %s workers', config.numWorkers );
forky( __dirname + '/server', config.numWorkers );

if ( config.isDev ){
  process.on('uncaughtException', function( error ){
    logger.error( 'Uncaught Exception', error );
    console.error( error, error.stack );
  });

  // forky( __dirname + '/workers/scheduler', 1 );
}