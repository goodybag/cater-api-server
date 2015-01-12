var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');

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
  var where = {restaurant_id: req.restaurant.id, 'orders.status': 'pending'};

  var options = {
    many: [{ table: 'order_items', alias: 'orderItems' }]
  };

  if ( req.param('edit_token') || req.body.edit_token ){
    where.edit_token = req.param('edit_token') || req.body.edit_token;
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

  db.orders.findOne(where, options, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    if (order) {
      req.url = req.url.replace(/^\/restaurants\/.*\/orders\/current/, '/orders/' + order.id);
      req.order = order;
      logger.info('Found pending order', { order: req.order });
    }

    next();
  });
};

module.exports.get = function(req, res, next) {
  // Load up the menu page with the specified order
  var order = new models.Order( req.order );

  if (!req.user.isAdmin() && !order.toJSON().editable) return res.redirect('/orders/' + order.attributes.id);
  models.Restaurant.findOne(order.attributes.restaurant_id, function(err, restaurant) {
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

      return res.render('menu', context);
    });
  });
};
