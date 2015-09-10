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
var odsChecker      = require('../public/js/lib/order-delivery-service-checker');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    param:        'oid'
  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GetOrder2');

    if ( !req.params[options.param].match(/^\d+$/) ) return res.status(404).render('404');

    var $options = {
      one:    []
    , many:   []
    , with:   []
    };

    if ( options.submittedDate ) {
      $options.submittedDate = options.submittedDate;
    }

    if ( options.location ){
      $options.one.push({ table: 'restaurant_locations', alias: 'location' });
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
      var restaurantOne = [ { table: 'regions', alias: 'region' } ];
      var restaurantMany = [
        { table: 'restaurant_delivery_times', alias: 'delivery_times' }
      , { table: 'restaurant_delivery_zips', alias: 'delivery_zips' }
      , { table: 'restaurant_lead_times', alias: 'lead_times' }
      , { table: 'restaurant_locations', alias: 'locations' }
      ];

      if ( options.amenities ){
        // I am sorry for this.
        // I wanted to look at all of the available amenities as well as if there's
        // a order_amenity record. It's aliased as "amenity.checked", so that I know which
        // have been added to an order.
        restaurantMany.push({
          table: 'amenities'
        , alias: 'amenities'
        , columns:  [ '*'
                    , {
                        type: 'exists'
                      , expression: {
                          type: 'select'
                        , columns: [ { expression: 1 } ]
                        , table: 'order_amenities'
                        , where: { order_id: '$orders.id$', amenity_id: '$amenities.id$' }
                        }
                      , alias: 'checked'
                      }
                    ]
        });
      }

      if ( options.restaurantContacts ){
        restaurantMany.push({
          table: 'contacts'
        , order: 'notify = true, name asc'
        });
      }

      $options.one.push({
        table:  'restaurants'
      , alias:  'restaurant'
      , one:    restaurantOne
      , many:   restaurantMany
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

    if ( options.orderFeedback ) {
      $options.one.push({ table: 'order_feedback', alias: 'order_feedback' });
    }

    if ( options.internalNotes ){

      $options.many.push({
        table:  'order_internal_notes'
      , columns:  db.order_internal_notes.getColumnListForTimezone(
                    req.user.attributes.region.timezone
                  )
      , alias:  'internal_notes'
      , order:  'created_at desc'
      , one:    [{ table: 'users', alias: 'user' }]
      });
    }

    logger.info('Finding order');
    db.orders.findOne( +req.params[options.param], $options, function( error, order ){
      if ( error ){
        logger.error('error trying to find order #%s', req.params.id, error)
        return res.error(errors.internal.DB_FAILURE, error);
      }

      if ( !order ) return res.render('404');

      if ( options.restaurant )
      if ( options.deliveryService ){
        order.restaurant.delivery_service = order.delivery_service;
      }

      if ( options.manifest ){
        order.manifest = manifest.create( order.orderItems );
      }

      if ( options.alerts ){
        order.alerts = [];

        if ( !order.lat_lng ){
          order.alerts.push({
            level: 'error'
          , message: 'This order was not able to be geocoded. This likely means the address is invalid.'
          });
        }

        if ( order.location && !order.location.lat_lng ){
          order.alerts.push({
            level: 'error'
          , message: 'This order\'s location has not been geocoded. This likely means the location address is invalid.'
          });
        }

        if ( !order.location && order.type === 'courier' ){
          order.alerts.push({
            level: 'error'
          , message: 'Cannot send courier notifications without a location set'
          });
        }
      }

      req.order = order;
      res.locals.order = order;
      req.logger.options.data.order = { id: order.id };

      utils.async.series([
        !options.restaurantDbModelFind ? utils.async.noop : function( done ){
          var orderParams = { id: order.id };
          Models.Restaurant.findOne( order.restaurant_id, orderParams, function( error, restaurant ){
            if ( error ){
              logger.error('error trying to lookup restaurant %s for order #%s', order.restaurant_id, req.params.id, error);
              return res.error(errors.internal.DB_FAILURE, error);
            }

            restaurant = restaurant.toJSON();

            if ( options.restaurant ){
              utils.defaults( restaurant, order.restaurant );
            }

            req.order.restaurant = restaurant;
            res.locals.order.restaurant = restaurant;

            return done();
          });
        }
      , orderEditable().bind(this, req, res)
      ], next );
    });
  };
};
