/**
 * Middleware: Build Receipt
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

module.exports = function(){
  return function( req, res, next ){
    if ( !req.param('oid') ) return next();

    (function( buildReceipt ){
      if ( req.param('rebuild') ) return buildReceipt();

      var filename = path.resolve(
        __dirname, '../'
      , config.receipt.dir
      , config.receipt.fileName.replace( ':id', req.param('oid') )
      );

      fs.exists( filename, function( exists ){
        if ( exists ) return next();

        buildReceipt();
      });
    })( function(){
      receipt.build( +req.param('oid'), function( error, result ){
        if ( error ){
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
