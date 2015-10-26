var utils     = require('../../../utils');
var buildPDF = require('./build-pdf');
var uploadToS3 = require('./upload-to-s3');

module.exports.fn = function( job, done ){
  utils.async.waterfall([
    buildPDF.fn.bind(this, job.data.pdf),
    uploadToS3.fn.bind(this, job.data.s3)
  ], done);
};

module.exports.name = 'build-pdf-upload-to-s3';
