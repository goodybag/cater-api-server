var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');

var db = require('../../db');
var queries = require('../../db/queries');

module.exports.list = function(req, res, next) {
  var order = new models.Order({id: parseInt(req.params.oid)});
  order.getOrderItems(function(error, items) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(items, 'toJSON'));
  });
}

module.exports.get = function(req, res, next) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(error, result) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(result ? result.toJSON() : 404);
  });
}

module.exports.add = function(req, res, next) {
  models.Item.findOne(parseInt(req.body.item_id), function(error, item) {
    if (!item) return res.send(404);
    var attrs = utils.extend(item.toJSON(), utils.pick(req.body, ['quantity', 'notes']));
    utils.extend(attrs, {item_id: attrs.id, order_id: req.params.oid});
    var orderItem = new models.OrderItem(utils.omit(attrs, ['id', 'created_at']));
    orderItem.save(function(error, rows, result) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      orderItem.attributes = utils.clone(rows[0]);
      res.send(201, orderItem.toJSON());
    });
  });
}

module.exports.update = function(req, res, next) {
  var query = queries.orderItem.update({quantity: parseInt(req.body.quantity), notes: req.body.notes}, parseInt(req.params.iid));
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(error, rows, result) {
    if(error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(rows[0]);
  });
}

module.exports.remove = function(req, res, next) {
  var query = queries.orderItem.del(parseInt(req.params.iid));
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(error, rows, result) {
    if(error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(200);
  });
}
