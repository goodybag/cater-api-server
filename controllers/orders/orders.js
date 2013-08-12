var
  db = require('../../db')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Order.find(req.query, function(error, models) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(models, 'toJSON'));
  });
}

module.exports.get = function(req, res) {
  models.Order.findOne(parseInt(req.params.id), function(error, order) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!order) return res.send(404);
    order.getOrderItems(function(err, items) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      var review = order.attributes.status === 'submitted'; // TODO: And user is order restaurant.
      res.render('order', {order: order.toJSON(), restaurantReview: review}, function(err, html) {
        if (err) return res.error(errors.internal.UNKNOWN, err);
        res.send(html);
      });
    });
  });
}

module.exports.update = function(req, res) {
  var order = new models.Order(utils.extend({id: req.params.id}, req.body));
  order.save(function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(order.toJSON());
  });
}

module.exports.listStatus = function(req, res) {
  models.OrderStatus.find(
    {where: {order_id: req.params.oid},
     order: {created_at: 'desc'}},
    function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      res.send(utils.invoke(results, 'toJSON'));
    }
  );
}

// this is a FSM definition
var transitions = {
  canceled: [],
  pending: ['canceled', 'submitted'],
  submitted: ['canceled', 'denied', 'accepted'],
  denied: [],
  accepted: ['delivered'],
  delivered: []
}

module.exports.changeStatus = function(req, res) {
  if (!req.body.status || !utils.has(transitions, req.body.status))
    return res.send(400, req.body.status + ' is not a valid order status');
  models.Order.findOne(req.params.oid, function(err, order) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!order) res.send(404);
    if (!utils.contains(transitions[order.attributes.status], req.body.status))
      return res.send(403, 'Cannot transition from status '+ order.attributes.status + ' to status ' + req.body.status);
    var status = new models.OrderStatus({status: req.body.status, order_id: order.attributes.id});
    status.save(function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      res.send(201, status.toJSON());
    });
  });
}
