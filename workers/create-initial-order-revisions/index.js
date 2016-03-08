var fs = require('fs');
var logger = require('../../lib/logger').create('Create-Initial-Order-Revisions');
var InitialOrderRevisionsCreator = require('./initial-order-revisions-creator');
var errorsPath = process.cwd() + '/errors.json';

InitialOrderRevisionsCreator
  .create({
    progress: process.stdout
  , logger: logger
  })
  .process( function( error, results ){
    if ( error ){
      throw error;
    }

    process.stdout.write('\n')

    logger.info( 'Completed with %s successful orders and %s errors', results.completed, results.errors.length );

    if ( results.errors.length ){
      fs.writeFileSync( errorsPath, JSON.stringify( results.errors ) );
      logger.info( 'Errors written to', errorsPath );
    }

    process.exit(0);
  });