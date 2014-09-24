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
    , with: []
    };

    if ( options.user ){
      $options.one.push({ table: 'users', alias: 'user' });
    }

    if ( options.restaurant ){
      $options.one.push({ table: 'restaurants', alias: 'restaurant' });
    }

    if ( options.deliveryService ){
      $options.one.push({ table: 'delivery_services', alias: 'delivery_service' });
    }

    if ( options.items ){
      $options.many.push({ table: 'order_items', alias: 'orderItems' })
    }

    if ( options.userAddresses ){
      $options.many.push({ table: 'addresses', alias: 'user_addresses', where: { user_id: '$orders.user_id$' } })
    }

    if ( options.userPaymentMethods ){
      $options.with.push({
        type: 'select'
      , name: 'upm'
      , table: 'users_payment_methods'
      , columns: ['users_payment_methods.*', 'payment_methods.*']
      , joins: {
          payment_methods: {
            type: 'left'
          , on: { id: '$users_payment_methods.payment_method_id$' }
          }
        }
      });

      $options.many.push({ table: 'upm', alias: 'user_payment_methods', where: { user_id: '$orders.user_id$' } })
    }

    logger.info('Finding order');
    db.orders.findOne( +req.param( options.param ), $options, function( error, order ){
      if ( error ){
        logger.error('error trying to find order #%s', req.params.id, error)
        return res.error(errors.internal.DB_FAILURE, error);
      }

      if ( !order ) return res.render('404');

      if ( options.user )
      if ( options.userAddresses ){
        order.user.addresses = order.user_addresses;
        delete order.user_addresses;
      }

      if ( options.user )
      if ( options.userPaymentMethods ){
        order.user.payment_methods = order.user_payment_methods;
        delete order.user_payment_methods;
      }

      if ( options.restaurant )
      if ( options.deliveryService ){
        order.restaurant.delivery_service = order.delivery_service;
      }

      req.order = order;
      res.locals.order = order;
      req.logger.options.data.order = { id: order.id };
      next();
    });
  };
};
