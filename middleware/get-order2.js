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
      var users = $options.one.push({
        table: 'users'
      , alias: 'user'
      , many:  []
      , one:   []
      });

      users = $options.one[ users - 1 ];

      if ( options.userAddresses ){
        users.many.push({ table: 'addresses' });
      }

      if ( options.userPaymentMethods ){
        users.many.push({
          table:    'users_payment_methods'
        , columns:  [ 'users_payment_methods.*'
                    , 'payment_methods.type'
                    , 'payment_methods.uri'
                    , 'payment_methods.data' ]
        , alias:    'payment_methods'
        , joins:    { payment_methods: {
                        type: 'left'
                      , on:   { id: '$users_payment_methods.payment_method_id$' }
                      }
                    }
        });
      }
    }

    if ( options.restaurant ){
      $options.one.push({
        table:  'restaurants'
      , alias:  'restaurant'
      , one:    [ { table: 'regions', alias: 'region' } ]
      , many:   [ { table: 'restaurant_delivery_times', alias: 'delivery_times' }
                , { table: 'restaurant_delivery_zips', alias: 'delivery_zips' }
                , { table: 'restaurant_lead_times', alias: 'lead_times' } ]
      });
    }

    if ( options.deliveryService ){
      $options.one.push({ table: 'delivery_services', alias: 'delivery_service' });
    }

    if ( options.items ){
      $options.many.push({ table: 'order_items', alias: 'orderItems' })
    }

    logger.info('Finding order');
    db.orders.findOne( +req.param( options.param ), $options, function( error, order ){
      if ( error ){
        logger.error('error trying to find order #%s', req.params.id, error)
        return res.error(errors.internal.DB_FAILURE, error);
      }

      if ( !order ) return res.render('404');

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
