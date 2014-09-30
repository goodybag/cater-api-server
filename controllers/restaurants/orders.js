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

module.exports.list = function(req, res) {
  // only show restaurant managers orders with a status of submitted, denied, or accepted
  var defaultFilter = (req.order.isRestaurantManager) ? ['submitted', 'denied', 'accepted'] : 'all';
  if (req.order.isRestaurantManager && !utils.contains(defaultFilter, req.query.filter)) req.query.filter = null;
  var filter = utils.contains(models.Order.statuses, req.query.filter) ? req.query.filter : defaultFilter;

  //TODO: middleware to validate and sanitize query object
  var tasks = [
    function(callback) {
      var query = utils.extend({where: {}}, req.query);
      utils.extend(query.where, {'restaurant_id': req.params.rid});
      models.Order.findByStatus(query, filter, callback);
    },

    function(callback) {
      models.Restaurant.findOne(req.params.rid, callback);
    }
  ];

  utils.async.parallel(tasks, function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.render('restaurant-orders', {
      orders: utils.invoke(results[0], 'toJSON')
    , restaurant: results[1].toJSON()
    , isRestaurantManager: req.order.isRestaurantManager
    , isAdmin: req.order.isAdmin
    , filter: filter
    });
  });
}

module.exports.current = function(req, res, next) {
  var where = {restaurant_id: req.params.rid, 'orders.status': 'pending'};

  if ( req.param('edit_token') || req.body.edit_token ){
    where.edit_token = req.param('edit_token') || req.body.edit_token;
  } else {
    where.user_id = req.user.attributes.id;
  }

  db.orders.findOne(where, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    if (order) {
      req.url = req.url.replace(/^\/restaurants\/.*\/orders\/current/, '/orders/' + order.id);
      req.order = order;
    }

    next();
  });
};

module.exports.get = function(req, res, next) {
  // Load up the menu page with the specified order
  models.Order.findOne(req.params.oid, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.render('404');
    if (!req.user.isAdmin && !order.toJSON().editable) return res.redirect('/orders/' + order.attributes.id);
    // if (order.status === 'pending') return res.redirect('/restaurants/' + req.params.rid);
    order.getOrderItems(function(err, items) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
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
    });
  });
};
