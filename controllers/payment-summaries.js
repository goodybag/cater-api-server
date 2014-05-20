/**
 * Payment Summaries
 */

var utils   = require('../utils');
var venter  = require('../lib/venter');
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