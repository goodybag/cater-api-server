var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  var tasks = [
    function(callback) {
      var query = utils.extend({where: {}}, req.query);
      utils.extend(query.where, {'restaurant_id': req.params.rid});
      models.Order.find(query, callback);
    },

    function(callback) {
      models.Restaurant.findOne(req.params.rid, callback);
    }
  ];

  utils.async.parallel(tasks, function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.render('restaurant-orders', {orders: utils.invoke(results[0], 'toJSON'), restaurant: results[1].toJSON()}, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, error);
      res.send(html);
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
