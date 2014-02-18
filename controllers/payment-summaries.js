/**
 * Payment Summaries
 */

var utils = require('../utils');

module.exports.getPdf = function( req, res ){
  var s3 = utils.s3.createClient({
    key:    config.amazon.awsId
  , secret: config.amazon.awsSecret
  , bucket: config.paymentSummaries.bucket
  });

  var file = config.paymentSummaries.fileName.replace( ':psid', req.param('id') );

  s3.getFile( '/' + file, function( error, fstream ){
    if ( error ) return res.error(404);

    fstream.pipe( res );
  });
};