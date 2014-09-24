/**
 * Get Order
 * Attaches an order model to the request based on request parameter ID
 */

var utils     = require('../utils');
var errors    = require('../errors');
var db        = require('../db');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    param:        'oid'
  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GetOrder2');

    var $options = {
      one:  []
    , many: []
    };

    if ( options.user ){
      $options.one.push({ table: 'users', alias: 'user' });
    }

    if ( options.restaurant ){
      $options.one.push({ table: 'restaurants', alias: 'restaurant' });
    }

    if ( options.items ){
      $options.many.push({ table: 'order_items', alias: 'orderItems' })
    }

    if ( options.userAddresses ){
      $options.many.push({ table: 'addresses', alias: 'user_addresses', where: { user_id: '$addresses.user_id$' } })
    }

    if ( options.userPaymentMethods ){
      
    }

    logger.info('Finding order');
    db.orders.findOne( +req.param( options.param ), $options, function( error, order ){
      if ( error ){
        logger.error('error trying to find order #%s', req.params.id, error)
        return res.error(errors.internal.DB_FAILURE, error);
      }

      if ( !order ) return res.render('404');

      req.order = order;
      res.locals.order = order;
      next();
    });
  };
};
