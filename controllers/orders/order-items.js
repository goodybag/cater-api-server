var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');

module.exports.list = function(req, res, next) {
  (new models.Order({id: req.oid})).getItems(function(err, items) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(utils.invoke(items, 'toJSON'));
  });
}

module.exports.get = function(req, res, next) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(err, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(result ? result.toJSON() : 404);
  });
}

module.exports.add = function(req, res, next) {
  models.Item.findOne(parseInt(req.body.item), function(err, item) {
    if (!item) return res.send(404);
    var attrs = utils.extend(item.toJSON(), utils.pick(req.body, ['quantity', 'notes']));
    utils.extend(attrs, {item_id: attrs.id, order_id: req.params.oid});
    var orderItem = new models.OrderItem(utils.omit(attrs, ['id', 'created_at']));
    orderItem.save(function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      orderItem.attributes = utils.clone(rows[0]);
      res.send(201, orderItem.toJSON());
    });
  });
}

module.exports.update = function(req, res, next) {
  var update = new models.OrderItem(utils.extend({id: req.params.iid}, req.body));
  update.save(function(err, rows, result) {
    if (err) {
      if (err.code === 403 || err.code === 404) return res.send(err.code, err.message);
      return res.error(errors.internal.DB_FAILURE, err);
    }
    res.send(update.toJSON());
  });
}

module.exports.remove = function(req, res, next) {
  var item = new models.OrderItem({id: req.params.iid});
  item.destroy(function(err, rows, result) {
    if (err) {
      if (err.code === 403 || err.code === 404) return res.send(err.code, err.message);
      return res.error(errors.internal.DB_FAILURE, err);
    }
    res.send(200);
  });
}
