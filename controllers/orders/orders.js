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
      res.render('order', {order: order.toJSON()}, function(err, html) {
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

module.exports.changeStatus = function(req, res) {
  var status = new models.OrderStatus(req.body);
  status.save(function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(201, status.toJSON());
  });
}
