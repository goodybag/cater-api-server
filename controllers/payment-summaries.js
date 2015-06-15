/**
 * Payment Summaries
 */

var moment  = require('moment');
var utils   = require('../utils');
var db      = require('../db');
var venter  = require('../lib/venter');
var pdfs    = require('../lib/pdfs');
var m       = require('dirac-middleware');

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
  options = utils.defaults( options || {}, {
    idField: 'id'
  , restaurantIdField: 'restaurant_id'
  });

  if ( !options.idField ) throw new Error('emitPaymentSummaryChange - options.idField is required');

  return function( req, res, next ){
    if ( res.statusCode >= 300 ) return next();

    venter.emit(
      'payment-summary:change'
    , req.params[options.idField]
    , req.params[options.restaurantIdField]
    );

    next();
  };
};

module.exports.send = function( req, res ){
  if ( !Array.isArray( req.body.recipients ) ){
    res.status(400).json({
      message: 'Invalid format for `recipients` field. Must be an Array'
    });
  }

  var id        = req.params[payment_summary_id];
  var s3        = pdfs.pms.getS3Client();
  var fileName  = 'payment-summary-' + id + '.pdf';

  utils.async.waterfall([
    db.payment_summaries.findOne.bind( db.payment_summaries, id )
  , function( paymentSummary, next ){
      s3.getFile( '/' + fileName, function( error, stream ){
        return next( error, paymentSummary, stream );
      });
    }
  , function( paymentSummary, fileStream, next ){
      utils.sendMail2({
        to:         req.body.recipients
      , from:       'info@goodybag.com'
      , subject:    'Goodybag Payment Summary #' + id
      , attachment: { streamSource: fileStream, fileName: fileName  }
      , text:       [ 'Attached is your Goodybag Payment Summary for '
                    , moment( paymentSummary.payment_date ).format('MM/DD/YYYY')
                    ].join('')
      }, next );
    }
  ], function( error ){
    if ( error ){
      return res.status(500).json( error );
    }

    res.send(204);
  });
};
