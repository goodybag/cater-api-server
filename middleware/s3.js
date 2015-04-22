/**
 * S3 Middleware/Route Handler
 *
 * Usage:
 * app.get('/some/route/my-file-:id.doc', s3({
 *   // Path on the S3 bucket
 *   path: '/my-file-:id.doc'
 * , key:  MY_AWS_KEY
 * , secret: MY_AWS_SECRET
 * , bucket: 'some-bucket'
 * }));
 */

var knox = require('knox');
var pathToRegex = require('path-to-regexp');

module.exports = function( options ){
  options = options || {};

  [
    'bucket', 'key', 'secret', 'path'
  ].forEach( function( prop ){
    if ( !(prop in options) ){
      throw new Error('Missing required property: `' + prop + '`');
    }
  });

  var pathParts = [];
  pathToRegex( options.path, pathParts );

  return function( req, res, next ){
    var s3path = options.path;

    pathParts.forEach( function( part ){
      s3path = s3path.replace( new RegExp( ':' + part.name, 'g' ), req.params[part.name] );
    });

    var logger = req.logger.create('Middleware-S3', {
      data: { path: s3path }
    });

    knox.createClient(
      options
    ).getFile( s3path, function( error, fileRes ){
      if ( error ){
        logger.error( 'Error getting file from s3', {
          error: error
        , path:  s3path
        });
        return res.error( error );
      }

      fileRes.pipe( res );
    });
  };
};
