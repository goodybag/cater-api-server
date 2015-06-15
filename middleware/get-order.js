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
    Models.Order.findOne( +req.params[options.param], function( error, order ){
      if ( error ) return next( error );

      req.order = order;
      res.locals.order = order.toJSON();

      if ( !options.withItems ) return next();

      order.getOrderItems( function( error ){
        if ( error ) return next( error );

        var jsonOptions = {};

        if ( options.withManifest ) jsonOptions.manifest = true;

        res.locals.order = order.toJSON( jsonOptions );

        next();
      });
    });
  };
};
