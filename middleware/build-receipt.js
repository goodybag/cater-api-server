/**
 * Middleware: Build Receipt
 *
 * Ensure that a PDF version of a receipt exists. If it does not,
 * send add a build job to the receipt queue.
 *
 * usage: app.get('/route', m.buildReceipt(), ... )
 */

var path    = require('path');
var fs      = require('fs');
var receipt = require('../lib/receipt');
var config  = require('../config');

module.exports = function(){
  return function( req, res, next ){
    if ( !req.param('oid') ) return next();

    var filename = path.resolve(
      __dirname, '../'
    , config.receipt.dir
    , config.receipt.fileName.replace( ':id', req.param('oid') )
    );

    fs.exists( filename, function( exists ){
      if ( exists ) return next();

      receipt.build( +req.param('oid'), function( error, result ){
        if ( error ){
          console.log(error);
          if ( 'httpStatus' in error && error.httpStatus === 404 ){
            return res.status(404).render('404');
          }

          return res.status(500).render('500');
        }

        next();
      });
    });
  }
};
