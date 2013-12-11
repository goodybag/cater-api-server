var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');
var states = require('../../public/states');
var venter = require('../../lib/venter');

var db = require('../../db');
var queries = require('../../db/queries');

module.exports.list = function(req, res, next) {
  var order = new models.Order({id: parseInt(req.params.oid)});
  order.getOrderItems(function(error, items) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(items, 'toJSON'));
  });
}

// TODO: remove all the stuff we don't need here
module.exports.summary = function(req, res, next) {
  models.Order.findOne(parseInt(req.params.oid), function(error, order) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!order) return res.status(404).render('404');
    order.getOrderItems(function(err, items) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);

      var review = order.attributes.status === 'submitted' && req.query.review_token === order.attributes.review_token;
      var isOwner = req.session.user && req.session.user.id === order.attributes.user_id;
      utils.findWhere(states, {abbr: order.attributes.state || 'TX'}).default = true;
      var context = {
        order: order.toJSON(),
        restaurantReview: review,
        owner: isOwner,
        admin: req.session.user && utils.contains(req.session.user.groups, 'admin'),
        states: states,
        orderParams: req.session.orderParams,
        query: req.query,
        step: 1
      };

      if (!context.owner && !context.admin) return res.status(404).render('404');

      // orders are always editable for an admin
      if (req.session.user && utils.contains(req.session.user.groups, 'admin'))
        context.order.editable = true;

      res.render('order-items', context, function(err, html) {
        if (err) return res.error(errors.internal.UNKNOWN, err);
        res.send(html);
      });
    });
  });
};

module.exports.get = function(req, res, next) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(error, result) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(result ? result.toJSON() : 404);
  });
}

module.exports.add = function(req, res, next, order) {
  if (!order) return res.render('404');
  var editable = utils.contains(req.session.user.groups, 'admin') || utils.contains(['pending', 'submitted'], order.attributes.status);
  if (!editable) return res.json(403, 'nope');
  var attrs = utils.pick(req.body, ['quantity', 'notes', 'recipient', 'item_id', 'options_sets']);
  models.OrderItem.createFromItem(req.body.item_id, order.attributes.id, attrs, function(err, orderItem) {
    if (err) {
      return err === 404 ? res.json(404, 'Item Not Found') : res.error(errors.internal.DB_FAILURE, err);
    }
    orderItem.save(function(err, rows, result) {
      return res.send(201, orderItem.toJSON());
    });
  });
};

module.exports.update = function(req, res, next, order) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(err, orderItem) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (orderItem == null) return res.send(404);

    var updates = utils.pick(req.body, ['quantity', 'notes', 'recipient'])
    if (req.body.options_sets !== undefined)
      updates.options_sets = JSON.stringify(models.OrderItem.sanitizeOptions(orderItem.attributes.options_sets, req.body.options_sets));

    var query = queries.orderItem.update(updates, parseInt(req.params.iid));
    var sql = db.builder.sql(query);

    db.query(sql.query, sql.values, function(error, rows, result) {
      if(error) return res.error(errors.internal.DB_FAILURE, error);
      res.send(rows[0]);

      venter.emit( 'order:change', req.param('oid') );
    });
  });
}

module.exports.remove = function(req, res, next, order) {
  var query = queries.orderItem.del(parseInt(req.params.iid));
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(error, rows, result) {
    if(error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(200);

    venter.emit( 'order:change', req.param('oid') );
  });
}
