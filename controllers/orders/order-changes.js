var errors = require('../../errors');
var models = require('../../models');
var utils  = require('../../utils');


module.exports.list = function(req, res, next) {
  models.Change.find({order_id: req.params.oid}, function(err, changes) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    return res.json(200, utils.invoke(changes, 'toJSON'));
    // TODO: html
  });
};

module.exports.get = function(req, res, next) {
  models.Change.findOne(req.params.cid, function(err, change) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!change) return res.render('404');
    return res.json(200, change.toJSON());
    // TODO: html
  });
};

// Decorator for creating / updating changes
// Takes a function which takes a request, an order, and a change object and modifies the change object appropriately
// The fourth parameter is a done callback that should be called when the function is finished modifying the change.
function changer(func) {
  return function(req, res, next, order) {
    var isAdmin = req.session.user && utils.contains(req.session.user.groups, 'admin');
    models.Change.getChange(order, isAdmin, function(err, change) {
      if (err)
        return utils.contains([404, 403], err) ? res.json(err, {}) : res.error(errors.internal.DB_FAILURE, err);

      func(req, change, order, function(err) {
        if (err) return res.error(errors.internal.UNKNOWN, err);
        change.save(function(err, rows, result) {
          if (err) return res.error(errors.internal.DB_FAILURE, err);
          res.json(201, change.toJSON());  // TODO: is this best?
        });
      });
    });
  };
};

module.exports.orderUpdate = changer(function(req, change, order, done) {
  // like update, but create a pending change instead of applying it immedietly
  var delta = utils.pick(req.body, models.Order.updateableFields);
  var changeSummaries = utils.map(delta, function(val, key, obj) {
    return ['Change', key, 'from', order.attributes[key], 'to', val].join(' ');
  });

  utils.extend(change.attributes.order_json, delta);
  change.attributes.change_summaries = change.attributes.change_summaries.concat(changeSummaries);
  done();
});

module.exports.addItem = changer(function(req, change, order, done) {
  var attrs = utils.pick(req.body, ['quantity', 'notes', 'recipient', 'item_id', 'options_sets']);
  models.OrderItem.createFromItem(req.body.item_id, order.attributes.id, attrs, function(err, orderItem) {
    if (err)
      return err === 404 ? res.json(404, 'Item Not Found') : res.error(errors.internal.DB_FAILURE, err);

    change.attributes.order_json.orderItems.push(orderItem.toJSON());
    change.attributes.change_summaries.push('Added item ' + orderItem.attributes.name + ' to order.');
    done();
  });
});

module.exports.removeItem = changer(function(req, change, order, done) {
  var json = change.attributes.order_json;
  var toRemove = utils.findWhere(json.orderItems, {id: parseInt(req.params.iid)}); // NOTE: ideally, all ids would be strings, but this works for now
  if (toRemove == null) return done({code:404, message: 'OrderItem not found on order: ' + req.params.iid});
  json.orderItems = utils.without(json.orderItems, toRemove);
  change.attributes.change_summaries.push('Removed item ' + toRemove.name + ' from order.');
  done();
});

module.exports.updateItem = changer(function(req, change, order, done) {
  var item = utils.findWhere(change.attributes.order_json.orderItems, {id: parseInt(req.params.iid)});
  var updates = utils.pick(req.body, ['quantity', 'notes', 'recipient']);
  if (req.body.options_sets !== undefined)
    updates.options_sets = models.OrderItem.sanitizeOptions(item.options_sets, req.body.options_sets);
  var changeSummaries = utils.map(updates, function(val, key, obj) {
    return ['Item', item.name, key, 'changed'].concat(key !== 'options_sets' ? ['from', item[key], 'to', val] : []).join(' ') + '.';
  });
  utils.extend(item, updates);
  Array.prototype.push.apply(change.attributes.change_summaries, changeSummaries);
  done();
});

module.exports.update = function(req, res, next) {
  var adminUpdates = utils.omit(req.body, ['status']);
  models.Change.findOne(req.params.cid, function(err, change) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!change) return res.json(404, 'Not Found');

    var isAdmin = req.session.user && utils.contains(req.session.user.groups, 'admin');
    // TODO: use async to enforce sequencing
    if (isAdmin)
      change.save(adminUpdates, function(err, rows, result) {});
    if (req.body.status)
      change.changeStatus(req.body.status, function(err) {});
    var done = function(err) {
      if (err)
        return typeof err === 'number' ? res.json(err, {}) : res.error(errors.internal.DB_FAILURE, err);
      return res.json(200, change.toJSON());
    };
    return res.json(200, change.toJSON());
  });
};

module.exports.cancel = function(req, res, next) {
  models.Change.findOne(req.params.cid, function(err, change) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!change) return res.json(404, 'Not Found');

    var isAdmin = req.session.user && utils.contains(req.session.user.groups, 'admin');
    change.changeStatus('canceled', isAdmin, function(err) {
      if (err)
        return typeof err === 'number' ? res.json(err, {}) : res.error(errors.internal.DB_FAILURE, err);
      return res.json(200, change.toJSON());
    });
  });
};
