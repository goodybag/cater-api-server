/**
 * Payment Summaries
 */

var utils   = require('../utils');
var pms     = require('../lib/pms');
var venter  = require('../lib/venter');
var m       = require('dirac-middleware');

module.exports.getPdf = function( req, res ){
  var s3 = pms.getS3Client();
  var file = pms.getFileName( req.param('psid') );

  s3.getFile( '/' + file, function( error, fstream ){
    if ( error ) return res.error(404);

    fstream.pipe( res );
  });
};

module.exports.applyRestaurantId = function(){
  return m.param( 'restaurant_id', function( value, query, options ){
    query['payment_summaries.restaurant_id'] = value;
  });
};

module.exports.applyRestaurantIdForNonJoins = function(){
  return m.param( 'restaurant_id', function( value, query, options ){
    query.$exists = {
      type:     'select'
    , columns:  [{ expression: 1 }]
    , table:    'payment_summaries'
    , where:    { restaurant_id: value }
    };
  });
};

module.exports.emitPaymentSummaryChange = function( options ){
  options = options || {
    idField: 'id'
  };

  if ( !options.idField ) throw new Error('emitPaymentSummaryChange - options.idField is required');

  return function( req, res, next ){
    if ( res.statusCode >= 300 ) return next();

    venter.emit(
      'payment-summary:change'
    , req.param( options.idField )
    , req.param('restaurant_id')
    );

    next();
  };
};