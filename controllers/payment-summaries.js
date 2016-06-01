/**
 * Payment Summaries
 */

var moment  = require('moment');
var utils   = require('../utils');
var db      = require('../db');
var venter  = require('../lib/venter');
var pdfs    = require('../lib/pdfs');
var m       = require('dirac-middleware');
var PMS     = require('stamps/payment-summaries/db');
var errors  = require('../errors');
var scheduler = require('../lib/scheduler');

var PMSEmail = PMS.compose( require('stamps/payment-summaries/email') );

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

module.exports.get = function( req, res ){
  PMS({ id: req.params.id, restaurant_id: req.params.restaurant_id })
    .fetch( function( error, result ){
      if ( error ){
        req.logger.warn('Error looking Payment Summary', {
          error: error
        });

        return res.error( 'httpCode' in error ? error : errors.internal.DB_FAILURE, error );
      }

      res.json( result );
    });
};

module.exports.send = function( req, res ){
  PMSEmail({ id: req.params.id, restaurant_id: req.params.restaurant_id })
    .sendEmail( function( error ){
      if ( error ){
        req.logger.warn('Error payment summary', {
          error: error
        });

        return res.error( errors.internal.UNKNOWN, error );
      }

      res.send(204);
    });
};

module.exports.createPeriodTotalRequest = function( req, res, next ){
  var data = utils.pick( req.body, [
    'period_begin', 'period_end', 'recipient'
  ]);

  scheduler.enqueue( 'send-payment-summaries-total-payout', new Date(), data, ( error )=>{
    if ( error ){
      req.logger.warn('Error enqueueing send-payment-summaries-total-payout', {
        error
      });

      return next( error );
    }

    res.status(204).send();
  });
};
