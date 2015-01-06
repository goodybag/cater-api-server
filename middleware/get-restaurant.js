/**
 * Get Restaurant
 * Attaches a restaurant object to the request
 */

var utils       = require('../utils');
var errors      = require('../errors');
var db          = require('../db');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    param:        'id'
  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GetOrder2');

    var $options = {
      one:    []
    , many:   []
    , with:   []
    };

    if ( options.region ){
      $options.one.push({ table: 'regions', alias: 'region' });
    }

    if ( options.delivery ){
      $options.many.push({ table: 'restaurant_delivery_times', alias: 'delivery_times' });
      $options.many.push({ table: 'restaurant_delivery_zips', alias: 'delivery_zips' });
      $options.many.push({ table: 'restaurant_lead_times', alias: 'lead_times' });
    }

    if ( options.items ){
      $options.many.push({ table: 'items' });
    }

    if ( options.amenities ){
      // I am sorry for this.
      // I wanted to look at all of the available amenities as well as if there's
      // a order_amenity record. It's aliased as "amenity.checked", so that I know which
      // have been added to an order.
      $options.many.push({
        table: 'amenities'
      , alias: 'amenities'
      , columns:  [ '*'
                  , { type: 'exists'
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

    logger.info('Finding restaurant');
    db.restaurants.findOne( +req.param( options.param ), $options, function( error, restaurant ){
      if ( error ){
        logger.error('error trying to find restaurant #%s', req.params.id, error)
        return res.error(errors.internal.DB_FAILURE, error);
      }

      if ( !restaurant ) return res.render('404');

      if ( options.restaurant )
      if ( options.deliveryService ){
        order.restaurant.delivery_service = order.delivery_service;
      }

      if ( options.manifest ){
        order.manifest = manifest.create( order.orderItems );
      }

      req.restaurant = restaurant;
      res.locals.restaurant = restaurant;

      return next();
  };
};
