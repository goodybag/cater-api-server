var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');

module.exports.list = function(req, res) {
  var filter = utils.contains(models.Order.statuses, req.query.filter) ? req.query.filter : 'all';
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
    , filter: filter
    });
  });
}

module.exports.current = function(req, res, next) {
  if (!req.session.user) return next();
  var where = {restaurant_id: req.params.rid, user_id: req.session.user.id, 'orders.status': 'pending'};
  models.Order.findOne({where: where}, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    if (order) {
      req.url = req.url.replace(/^\/restaurants\/.*\/orders\/current/, '/orders/' + order.attributes.id);
    }

    next();
  });
};

module.exports.get = function(req, res, next) {
  // Load up the menu page with the specified order
  models.Order.findOne(req.params.oid, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!order) return res.render('404');
    if (!order.toJSON().editable) return res.redirect('/orders/' + order.attributes.id);
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

          return res.render('menu', context);
        });
      });
    });
  });
};
