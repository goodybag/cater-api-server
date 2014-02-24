/**
 * Payment Summaries
 */

var utils = require('../utils');
var pms   = require('../lib/pms');

module.exports.getPdf = function( req, res ){
  var s3 = pms.getS3Client();
  var file = pms.getFileName( req.param('psid') );

  s3.getFile( '/' + file, function( error, fstream ){
    if ( error ) return res.error(404);

    fstream.pipe( res );
  });
};