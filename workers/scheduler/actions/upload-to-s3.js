var path      = require('path');
var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../../../logger').scheduler;

module.exports = function( job, done ){
  var TAGS = [ 'upload-to-s3', 'job-' + job.id ];
  var logger = {};

  [ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
    logger[ level ] = slogger[ level ].bind( slogger, TAGS );
  });

  logger.info( 'Building PDF', job );

  var missing = [
    'bucket'
  , 'src'
  , 'dest'
  ].filter( function( required ){
    return !( required in job.data );
  });

  if ( missing.length > 0 ){
    logger.warn( 'Missing required fields: ' + missing.join(', '), { missing: missing } );

    return done({
      message: 'Missing required fields: ' + missing.join(', ')
    , details: missing
    });
  }

  var client = utils.s3.createClient({
    key:    config.amazon.awsId
  , secret: config.amazon.awsSecret
  , bucket: job.data.bucket
  });

  client.putFile( job.data.src, job.data.dest, done );
};