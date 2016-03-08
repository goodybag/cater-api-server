var models = require('../../models');
var errors = require('../../errors');
var utils  = require('../../utils');
var states = require('../../public/js/lib/states')
var venter = require('../../lib/venter');

var db = require('../../db');
var queries = require('../../db/queries');
var Order = require('stamps/orders/base');

module.exports.list = function(req, res, next) {
  res.json( res.locals.order.orderItems );
};

// TODO: remove all the stuff we don't need here
module.exports.summary = function(req, res, next) {
  var review = req.order.status === 'submitted' && req.query.review_token === req.order.review_token;
  utils.findWhere(states, {abbr: req.order.state || 'TX'}).default = true;
  var context = {
    order: new models.Order( req.order ).toJSON(),
    restaurantReview: review,
    isRestaurantManager: req.order.isRestaurantManager,
    isOwner: req.order.isOwner,
    isAdmin: req.order.isAdmin,
    states: states,
    orderParams: req.session.orderParams,
    query: req.query,
    step: 1
  };

  if (!context.isOwner && !context.isAdmin && !context.isRestaurantManager) return res.status(404).render('404');

  // orders are always editable for an admin
  if (req.order.isAdmin)
    context.order.editable = true;

  res.render('order-items', context, function(err, html) {
    if (err) return res.error(errors.internal.UNKNOWN, err);
    res.send(html);
  });
};

module.exports.get = function(req, res, next) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(error, result) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(result ? result.toJSON() : 404);
  });
}

function sanitizeOptions(oldOpts, newOpts) {
  // get the current state, and only the current state, from each option, keyed by uuid.
  var states = utils.object(utils.map(utils.flatten(utils.pluck(newOpts, 'options'), true), function(option, index, arr) {
    return [option.id, !!option.state];
  }));

  // clone the old options, but with the new states
  return utils.map(oldOpts, function(set) {
    return utils.extend({}, set, {options: utils.map(set.options, function(option) {
      return utils.extend({state: !!states[option.id]}, utils.pick(option, ['id', 'name', 'price', 'description']));
    })});
  });
}

module.exports.add = function(req, res, next) {
  var order = req.order;
  var editable =
    req.creatorId ||
    utils.contains(req.user.attributes.groups, 'admin') ||
    utils.contains(['pending', 'submitted'], req.order.status);

  if (!editable) return res.json(403, 'nope');
  models.Item.findOne(parseInt(req.body.item_id), function(err, item) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (!item) return res.send(404);
    var attrs = utils.extend(item.toJSON(), utils.pick(req.body, ['quantity', 'notes', 'recipient', 'item_id']), {order_id: req.params.oid});
    attrs.options_sets = JSON.stringify(sanitizeOptions(attrs.options_sets, req.body.options_sets));

    var orderItem = new models.OrderItem(utils.omit(attrs, ['id', 'created_at']));
    orderItem.save(function(error, rows, result) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      orderItem.attributes = utils.clone(rows[0]);

      var result = Order.applyPriceHikeToItem(
        orderItem.toJSON(), req.order.priority_account_price_hike_percentage
      );

      res.send(201, result);

      venter.emit('order:items:change', order, result);

      db.order_revisions.track( result.order_id, req.user.attributes.id, 'add-item', function( error ){
        if ( error ){
          req.logger.warn('Error tracking order revision', {
            order: { id: order.id }
          , error: error
          });
        }
      });
    });
  });
}

module.exports.update = function(req, res, next) {
  models.OrderItem.findOne(parseInt(req.params.iid), function(err, orderItem) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    if (orderItem == null) return res.send(404);

    var updates = utils.pick(req.body, ['quantity', 'notes', 'recipient'])
    if (req.body.options_sets !== undefined)
      updates.options_sets = JSON.stringify(sanitizeOptions(orderItem.attributes.options_sets, req.body.options_sets));

    var query = queries.orderItem.update(updates, parseInt(req.params.iid));
    var sql = db.builder.sql(query);

    db.query(sql.query, sql.values, function(error, rows, result) {
      if(error) return res.error(errors.internal.DB_FAILURE, error);

      var result = Order.applyPriceHikeToItem(
        utils.clone( rows[0] ), req.order.priority_account_price_hike_percentage
      );

      res.send( result );

      venter.emit( 'order:change', req.params.oid );
      venter.emit('order:items:change', req.order, result);

      db.order_revisions.track( result.order_id, req.user.attributes.id, 'update-item', function( error ){
        if ( error ){
          req.logger.warn('Error tracking order revision', {
            order: { id: order.id }
          , error: error
          });
        }
      });
    });
  });
}

module.exports.remove = function(req, res, next) {
  var query = queries.orderItem.del(parseInt(req.params.iid));
  var sql = db.builder.sql(query);

  db.query(sql.query, sql.values, function(error, rows, result) {
    if(error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(200, rows[0]);

    venter.emit( 'order:change', req.params.oid );
    venter.emit('order:items:change', req.order, result);

    db.order_revisions.track( rows[0].order_id, req.user.attributes.id, 'remove-item', function( error ){
      if ( error ){
        req.logger.warn('Error tracking order revision', {
          order: { id: order.id }
        , error: error
        });
      }
    });
  });
}
