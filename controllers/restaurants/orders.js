var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  var query = utils.extend({where: {}}, req.query);
  utils.extend(query.where, {'restaurant_id': req.params.rid});
  models.Order.find(query, function(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(results, 'toJSON'));
  });
}

module.exports.current = function(req, res, next) {
  if (!req.session.user) return next();
  var where = {restaurant_id: req.params.rid, user_id: req.session.user.id, 'latest.status': 'pending'};
  models.Order.findOne({where: where}, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    var done = function(order) {
      req.url = req.url.replace(/^\/restaurants\/.*\/orders\/current/, '/orders/' + order.attributes.id);
      next();
    }

    if (!order) {
      order = new models.Order({user_id: req.session.user.id, restaurant_id: req.params.rid});
      order.save(function(err) {
        if (err) return res.error(errors.internal.DB_FAILURE, err);
        done(order);
      });
    }
    else
      done(order);
  });
};
