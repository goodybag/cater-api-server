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
  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GetOrder2');

    var $where = {};

    var param = req.param( options.param );

    // use + instead of parseInt because:
    // parseInt('888-mini-cafe') === 888
    if ( isNaN( +param ) ){
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
      $options.many.push({ table: 'restaurant_delivery_times', alias: 'delivery_times' });
      $options.many.push({ table: 'restaurant_delivery_zips', alias: 'delivery_zips' });
      $options.many.push({ table: 'restaurant_lead_times', alias: 'lead_times' });
    }

    if ( options.items ){
      $options.many.push({
        table: 'items'
      , pluck: [{ table: 'tags', column: 'tag', order: { tag: 'asc' } }]
      });
    }

    if ( options.amenities ){
      $options.many.push({ table: 'amenities', alias: 'amenities' });
    }

    if ( options.photos ){
      $options.manypush({
        table: 'restaurant_photos'
      , alias: 'photos'
      , order: 'priority asc'
      });
    }

    logger.info('Finding restaurant');
    db.restaurants.findOne( $where, $options, function( error, restaurant ){
      if ( error ){
        logger.error( 'error trying to find restaurant #%s', +req.param( options.param ), {
          error: error
        });

        return res.error( errors.internal.DB_FAILURE, error );
      }

      if ( !restaurant ) return res.render('404');

      req.restaurant = restaurant;
      res.locals.restaurant = restaurant;

      return next();
    });
  };
};
