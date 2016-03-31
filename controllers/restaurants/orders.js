var moment = require('moment-timezone');
var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');
var m = require('../../middleware');
var Order = require('stamps/orders/base');

module.exports.listJSON = function(req, res) {
  var $query = utils.extend({}, req.queryOptions);

  $query.where = req.queryObj;

  models.Order.find( $query, function( error, results ){
    if ( error ) return res.error( errors.internal.DB_FAILURE, error );

    res.json( utils.invoke( results, 'toJSON' ) );
  });
};

module.exports.current = function(req, res, next) {
  var logger = req.logger.create('Current Order');

  logger.info('Lookup existing pending order');
  var where = {'orders.status': 'pending'};

  var options = {
    many: [{ table: 'order_items', alias: 'orderItems' }]
  , one:  [ { table: 'restaurants', alias: 'restaurant'
            , one: [{ table: 'regions', alias: 'region' }]
            , many: [ { table: 'restaurant_lead_times'
                      , alias: 'lead_times'
                      }
                    , { table: 'restaurant_pickup_lead_times'
                      , alias: 'pickup_lead_times'
                      }
                    ]
            }
          , { table: 'users', alias: 'user' }
          ]
  , joins: []
  };

  if ( req.restaurant ){
    where.restaurant_id = req.restaurant.id;
  } else {
    m.restaurantIdParam.applyValueToWhereClause(
      req.params.restaurant_id || req.params.id
    , where
    );
    options.joins.push( m.restaurantIdParam.getJoinFrom('orders') );
  }

  var edit_token = req.query.edit_token || req.params.edit_token || req.body.edit_token;
  if ( edit_token ){
    where.edit_token = edit_token;
  } else if ( req.user.attributes.id ) {
    where.user_id = req.user.attributes.id;
  } else if ( req.user.isGuest() && Array.isArray( req.session.guestOrders ) && req.session.guestOrders.length > 0 ){
    // Take the greatest ID's first
    logger.info('User is guest and has guestOrders', {
      guestOrders: req.session.guestOrders
    });
    where.id = { $in: req.session.guestOrders.sort(function(a,b){ return b > a; }) };
  } else {
    logger.info('Guest user and missing edit token; cannot find pending order');
    return next();
  }

  // Unless they're using an edit token, let's drill down the results
  // so that we only see relevant pending orders -
  // (that is, orders that haven't been expired for too long)
  if ( !edit_token ){
    where.datetime = {
      $custom: [
        "orders.datetime + interval '2 days' > now() at time zone orders.timezone"
      ]
    };
  }

  db.orders.findOne(where, options, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    if (order) {
      if ( !order.datetime || moment.tz( order.datetime, order.timezone ) < moment.tz( order.timezone ) ){
        if ( edit_token ){
          return res.render('shared-link/expired');
        } else {
          return next();
        }
      }

      req.url = req.url.replace(/^\/restaurants\/.*\/orders\/current/, '/orders/' + order.id);
      req.order = res.locals.order = order;
      Order.applyPriceHike( req.order );
      logger.info('Found pending order', { order: req.order });
    }

    next();
  });
};

module.exports.get = function(req, res, next) {
  // Load up the menu page with the specified order
  var order = new models.Order( req.order );

  if (!req.user.isAdmin() && !order.toJSON().editable) return res.redirect('/orders/' + order.attributes.id);
  var restaurantQuery = {
    where: { id: order.attributes.restaurant_id }
  , includes: [ {type: 'closed_restaurant_events'} ]
  };
  models.Restaurant.findOne(restaurantQuery, function(err, restaurant) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!restaurant) return res.error(errors.internal.UNKNOWN, 'no restaurant for existing order');
    restaurant.getItems(function(err, items) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      var context = {
        order: order.toJSON(),
        restaurant: restaurant.toJSON()
      };

      for ( var key in context.restaurant ){
        if ( !(key in context.order.restaurant) ){
          context.order.restaurant[ key ] = context.restaurant[ key ];
        }
      }

      context.order.restaurant._cached = db.cache.restaurants.byId( context.restaurant.id );

      return res.render('menu', context);
    });
  });
};
