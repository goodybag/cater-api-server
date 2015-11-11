/**
 * Get Restaurant
 * Attaches a restaurant object to the request
 */

var utils       = require('../utils');
var errors      = require('../errors');
var db          = require('../db');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    param:        'rid'
  , region:       true
  , delivery:     true
  , items:        true
  , amenities:    true
  , photos:       true
  , stripe:       false
  });

  return function( req, res, next ){
    var $where = {};

    var param = req.params[options.param];

    var logger = req.logger.create('Middleware-GetRestaurant', {
      restaurant_id: param
    });

    // use + instead of parseInt because:
    // parseInt('888-mini-cafe') === 888
    if ( options.getByUuid ) {
      $where.uuid = param;
    } else if ( isNaN( +param ) ){
      $where.text_id = param;
    } else {
      $where.id = param;
    }

    var $options = {
      one:    []
    , many:   []
    , pluck:  []
    , with:   []
    };

    if ( options.region ){
      $options.one.push({ table: 'regions', alias: 'region' });
    }

    if ( options.delivery ){
      $options.many.push({ table: 'restaurant_hours', alias: 'hours' });
      $options.many.push({ table: 'restaurant_pickup_lead_times', alias: 'pickup_lead_times' });
      $options.many.push({ table: 'restaurant_delivery_times', alias: 'delivery_times' });
      $options.many.push({ table: 'restaurant_delivery_zips', alias: 'delivery_zips' });
      $options.many.push({ table: 'restaurant_lead_times', alias: 'lead_times' });
    }

    if ( options.items ){
      $options.many.push({
        table: 'items'
      , pluck: [{ table: 'tags', column: 'name', order: { name: 'asc' } }]
      });
    }

    if ( options.amenities ){
      $options.many.push({ table: 'amenities', alias: 'amenities' });
    }

    if ( options.photos ){
      $options.many.push({
        table: 'restaurant_photos'
      , alias: 'photos'
      , order: 'priority asc'
      });
    }

    if ( options.notes ){
      $options.many.push({
        table: 'restaurant_notes'
      , alias: 'notes'
      , columns: [ 'note', { expression: 'created_at at time zone \'' + req.user.attributes.region.timezone + '\'', alias: 'created_at' } ]
      , order: 'created_at desc'
      , one: [ { table: 'users', alias: 'user' } ]
      });
    }

    logger.info('Finding restaurant');
    db.restaurants.findOne( $where, $options, function( error, restaurant ){
      if ( error ){
        logger.error( 'error trying to find restaurant #%s', +req.params[options.param], {
          error: error
        });

        return res.error( errors.internal.DB_FAILURE, error );
      }

      if ( !restaurant ) return res.render('404');

      req.restaurant = restaurant;
      res.locals.restaurant = restaurant;

      if ( options.stripe ){
        return utils.stripe.accounts.retrieve( restaurant.stripe_id, function( error, acct ){
          if ( error ){
            logger.warn('Error looking up stripe account')
          }

          restaurant.stripe_account = acct;

          return next();
        });
      }

      return next();
    });
  };
};
