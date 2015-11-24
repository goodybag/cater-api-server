var config = require('./config');
var logger = require('./lib/logger').create('Master');

logger.info( 'Forking %s workers', config.numWorkers );

require('forky')({
  path: __dirname + '/server'
, workers: config.numWorkers
});

if ( config.isDev ){
  process.on('uncaughtException', function( error ){
    logger.error( 'Uncaught Exception', error );
    console.error( error, error.stack );
  });

  process.on('unhandledRejection', function( error ){
    logger.error( 'Unhandled Rejection', error );
    console.error( error, error.stack );
  });
}