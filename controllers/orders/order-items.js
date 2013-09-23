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

function sanitizeOptions(oldOpts, newOpts) {
  // if new is null or undefined just return that
  if (newOpts == null) return newOpts;

  // get the current state, and only the current state, from each option, keyed by uuid.
  var states = utils.object(utils.map(utils.flatten(utils.pluck(newOpts, 'options'), true), function(option, index, arr) {
    return [option.id, !!option.state];
  }));

  // clone the old options, but with the new states
  return utils.map(oldOpts, function(set) {
    return utils.extend({}, set, {options: utils.map(set.options, function(option) {
      return utils.extend({state: states[option.id]}, utils.pick(option, ['id', 'name', 'price']));
    })});
  });
}

module.exports.add = function(req, res, next) {
  models.Item.findOne(parseInt(req.body.item_id), function(error, item) {
    if (!item) return res.send(404);
    var attrs = utils.extend(item.toJSON(), utils.pick(req.body, ['quantity', 'notes', 'item_id']), {order_id: req.params.oid});

    attrs.options_sets = sanitizeOptions(attrs.options_sets, req.body.options_sets);

    var orderItem = new models.OrderItem(utils.omit(attrs, ['id', 'created_at']));
    orderItem.save(function(error, rows, result) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      orderItem.attributes = utils.clone(rows[0]);
      res.send(201, orderItem.toJSON());
    });
  });
}

module.exports.update = function(req, res, next) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(err, orderItem) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    var updates = utils.pick(req.body, ['quantity', 'notes'])
    if (req.body.options_sets !== undefined) updates.options_sets = sanitizeOptions(orderItem.options_sets, req.body.options_sets);

    var query = queries.orderItem.update(updates, parseInt(req.params.iid));
    var sql = db.builder.sql(query);

    db.query(sql.query, sql.values, function(error, rows, result) {
      if(error) return res.error(errors.internal.DB_FAILURE, error);
      res.send(rows[0]);
    });
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
