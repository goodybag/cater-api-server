var path      = require('path');
var config    = require('../../../config');
var utils     = require('../../../utils');
var logger    = require('../../../logger').scheduler;

module.exports = function( job, done ){
  var missing = [
    'bucket'
  , 'src'
  , 'dest'
  ].filter( function( required ){
    return !( required in job.data );
  });

  if ( missing.length > 0 ){
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