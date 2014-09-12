var path      = require('path');
var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../logger');

module.exports = function( job, done ){
  var logger = slogger.create('UploadToS3', {
    data: job
  });

  logger.info('Uploading file');

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