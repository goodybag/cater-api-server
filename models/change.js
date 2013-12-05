var Model = require('./model');
var Order = require('./order');
var OrderItem = require('./order-item');
var utils = require('../utils');
var errors = require('../errors');

module.exports = Model.extend({
  changeStatus: function(status, isAdmin, callback) {
    if (callback === undefined) {
      callback = isAdmin;
      isAdmin = false;
    }
    if (callback == null) callback = utils.identity;
    if (this.attributes.status === status) return callback(null, null);

    if (!utils.has(this.constructor.statusFSM, status))
      return res.json(400, 'Invalid Status: ' + status + '.  Valid statuses are: ' + utils.keys(this.constructor.statusFSM));

    if (!isAdmin && !utils.contains(this.constructor.statusFSM[this.attributes.status], status))
      return res.json(403, ['Cannot transition from status ',  this.attributes.status, ' to status ', status, '.  Available tranistions from ', this.attributes.status, ' are: ', this.constructor.statusFSM[this.attributes.status]].join(''));

    // TODO: wrap these two in a transaction
    if (status === 'accepted') this.apply(isAdmin, function(err) {
      if (err) return callback(err);
      this.save({status: status}, utils.compose(callback, utils.identity));
    });
  },

  apply: function(isAdmin, callback) {
    var self = this;
    var json = self.attributes.order_json;
    Order.findOne(self.attributes.order_id, function(err, order) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      if (!order) return res.json(404);
      order.getOrderItems();
      var old = order.toJSON();
      var removedIds = utils.difference(utils.pluck(old.order_items, 'id'), utils.pluck(json.order_items, 'id'));

      // TODO: async.parallel
      utils.extend(order.attributes, self.attributes.order_json);
      order.save(function(err, rows, result) {
      });
      utils.each(json.order_items, function(orderItem) {
        // add new items and update exisiting ones
        (new OrderItem(orderItem)).save(function(err, rows, result) {});
      });
      utils.each(removedIds, function(id) {
        (new OrderItem({id: id})).destroy(function(err) {});
      });
    });
  }
}, {
  table: 'order_changes',
  getChange: function(orderId, isAdmin, callback) {
    if (callback === undefined) {
      callback = isAdmin;
      isAdmin = false;
    }
    var self = this;
    Order.findOne(orderId, function(err, order) {
      if (err) return callback(err);
      if (!order) return callback(404);

      // Check if change can be made.  Order must be in accepted state and still be cancelable.
      if (!isAdmin && !(order.attributes.status === 'accepted' && order.toJSON().cancelable))
        return callback(403);

      self.findOne({order_id: orderId}, function(err, change) {
        if (err) return callback(err);
        var orderJson = order.toJSON();
        var json = utils.extend(utils.pick(orderJson, Order.updateableFields), {order_items: orderJson.order_items});
        if (!change) change = new self({order_id: orderId, order_json: JSON.stringify(json)});
        return callback(null, change);
      });
    });
  },

  statusFSM: {
    canceled: [],
    submitted: ['canceled', 'denied', 'accepted'],
    denied: [],
    accepted: []
  }
});
