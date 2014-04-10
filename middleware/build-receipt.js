/**
 * Middleware: Build Receipt
 *
 * NOTE: This no longer acts like middleware. Instead, it acts like a handler
 *
 * Ensure that a PDF version of a receipt exists. If it does not,
 * send a build job to the receipt queue. If rebuild=true is in
 * the query params, the receipt will forcefully re-build.
 *
 * usage: app.get('/route', m.buildReceipt(), ... )
 */

var path    = require('path');
var fs      = require('fs');
var receipt = require('../lib/receipt');
var config  = require('../config');
var utils   = require('../utils');
var logger  = require('../logger').receipt;

var loggerTags = ['receipt', 'order'];

[ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
  logger[ level ] = logger[ level ].bind( logger, loggerTags );
});

module.exports = function(){
  return function( req, res, next ){
    if ( !req.param('oid') ) return next();

    utils.stage({
      'start':
      function( stage, done ){
        if ( req.param('rebuild') ) return stage('buildReceipt');
        // Don't worry about checking filesystem
        // We now save PDFs to filesystem for dev convenience only
        // stage('checkFilesystem');

        stage('checkS3');
      }

    , 'checkFilesystem':
      function( stage, done ){
        var filename = path.resolve(
          __dirname, '../'
        , config.receipt.dir
        , config.receipt.fileName.replace( ':id', req.param('oid') )
        );

        fs.exists( filename, function( exists ){
          if ( exists ) return done();

          stage('checkS3');
        });
      }

      // Check S3 for the receipt - If it's there, go ahead and download it
      // so future checks to s3 are circumvented
      // Also, go ahead and just pipe the response to the client
    , 'checkS3':
      function( stage, done ){
        logger.info( 'checking S3 for receipt #' + req.param('oid') );

        receipt.get( req.param('oid'), function( error, fileRes ){
          if ( error ) return stage('buildReceipt');

          // If S3 sent us back a 200 + an XML document, it's most likely their
          // way of saying `key not found` - but knox doesn't pick up on it
          // because it's xml. Either way, we probably need to re-build the PDF
          if ( fileRes.headers['content-type'] === 'application/xml' ){
            return stage('buildReceipt');
          }

          // Cache the file locally
          var receiptFileStream = fs.createWriteStream(
            receipt.getFullOrderPath( req.param('oid') )
          );

          logger.info( 'Sending receipt #'  + req.param('oid') );

          fileRes.pipe( res );
          fileRes.pipe( receiptFileStream );
        });
      }

    , 'buildReceipt':
      function( stage, done ){
        logger.info( 'Building receipt #' + req.param('oid') );
        receipt.build( +req.param('oid'), function( error, result ){
          if ( error ){
            logger.error( 'Error building receipt #'  + req.param('oid'), error );
            console.log('#######ERROR##########', error);

            if ( 'httpStatus' in error && error.httpStatus === 404 ){
              return res.status(404).render('404');
            }

            return res.status(500).render('500');
          }

          stage('sendFile');
        });
      }

    , 'sendFile':
      function( stage, done ){
        logger.info( 'Sending receipt #'  + req.param('oid') );

        fs.createReadStream(
          receipt.getFullOrderPath( req.param('oid') )
        ).pipe( res );
      }
    })( next );
  }
};
