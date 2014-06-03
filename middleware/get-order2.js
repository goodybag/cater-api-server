/**
 * Get Order
 * Attaches an order model to the request based on request parameter ID
 */

var utils     = require('../utils');
var db        = require('../db');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    param:        'oid'
  });

  return function( req, res, next ){
    db.orders.findOne( +req.param( options.param ), function( error, order ){
      if ( error ) return next( error );
      // if (err) return logger.db.error(TAGS, 'error trying to find order #' + req.params.id, err), res.error(errors.internal.DB_FAILURE, err);
      // if (!req.order) return res.render('404');
      req.order = order;
      res.locals.order = order;
      next();
    });
  };
};