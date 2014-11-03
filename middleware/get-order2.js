/**
 * Get Order
 * Attaches an order model to the request based on request parameter ID
 */

var utils           = require('../utils');
var errors          = require('../errors');
var Models          = require('../models');
var db              = require('../db');
var manifest        = require('../lib/order-manifester');
var orderEditable   = require('./order-editable');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    param:        'oid'
  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GetOrder2');

    var orderId = +req.param( options.param );

    var $options = {
      one:    []
    , many:   []
    , with:   []
    };

    if ( options.submittedDate ) {
      $options.submittedDate = options.submittedDate;
    }

    if ( options.user ){
      var users = $options.one.push({
        table: 'users'
      , alias: 'user'
      , many:  []
      , one:   []
      });

      users = $options.one[ users - 1 ];

      if ( options.userAddresses ){
        // Technically we should limit the addresses to what
        // the restaurant can deliver to, but given that that query
        // is quite complex with delivery services, they'll just have
        // to put up with errors if they select an address that doesn't work
        users.many.push({ table: 'addresses' });
      }

      if ( options.userPaymentMethods ){
        users.many.push({
          table:    'users_payment_methods'
        , columns:  [ 'payment_methods.*'
                    , 'users_payment_methods.name' ]
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

    if ( options.paymentMethod ){
      $options.one.push({ table: 'payment_methods', alias: 'payment_method' });
    }

    logger.info('Finding order');
    db.orders.findOne( orderId, $options, function( error, order ){
      if ( error ){
        logger.error( 'error trying to find order #%s', orderId, error );
        return res.error( errors.internal.DB_FAILURE, error );
      }

      if ( !order ) return res.render('404');

      if ( options.restaurant )
      if ( options.deliveryService ){
        order.restaurant.delivery_service = order.delivery_service;
      }

      if ( options.manifest ){
        order.manifest = manifest.create( order.orderItems );
      }

      req.order = order;
      res.locals.order = order;
      req.logger.options.data.order = { id: order.id };
      orderEditable().call(this, req, res, next);
    });
  };
};
