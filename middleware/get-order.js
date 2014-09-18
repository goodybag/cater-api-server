/**
 * Get Order
 * Attaches an order model to the request based on request parameter ID
 */

var utils     = require('../utils');
var Models    = require('../models');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    param:        'oid'
  , withItems:    false
  , withManifest: false
  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GetOrder');
    var orderId = +req.param( options.param );
    Models.Order.findOne( orderId, function( error, order ){
      if ( error ) {
        logger.error('Could not get order #%d', orderId, { error: error });
        return next( error );
      }

      req.order = order.toJSON();
      res.locals.order = order.toJSON();

      if ( !options.withItems ) {
        logger.info('Found order #%d (excluding items)', orderId, { order: req.order });
        return next();
      }

      order.getOrderItems( function( error ){
        if ( error ) {
          logger.error('Could not get order #%d\'s items', orderId, { error: error });
          return next( error );
        }

        var jsonOptions = {};

        if ( options.withManifest ) jsonOptions.manifest = true;

        res.locals.order = order.toJSON( jsonOptions );

        logger.info('Found order #%d (including items)', orderId, { order: order });
        next();
      });
    });
  };
};