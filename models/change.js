var Model = require('./model');
var Order = require('./order');
var OrderItem = require('./order-item');
var utils = require('../utils');
var errors = require('../errors');
var venter  = require('../lib/venter');

module.exports = Model.extend({
  changeStatus: function(status, isAdmin, callback) {
    if (callback === undefined) {
      callback = isAdmin;
      isAdmin = false;
    }

    if (callback == null) callback = utils.identity;
    var oldStatus = this.attributes.status;
    if (oldStatus === status) return callback(null, null);

    if (!utils.has(this.constructor.statusFSM, status))
      return res.json(400, 'Invalid Status: ' + status + '.  Valid statuses are: ' + utils.keys(this.constructor.statusFSM));

    if (!isAdmin && !utils.contains(this.constructor.statusFSM[oldStatus], status))
      return res.json(403, ['Cannot transition from status ',  oldStatus, ' to status ', status, '.  Available tranistions from ', oldStatus, ' are: ', this.constructor.statusFSM[oldStatus]].join(''));

    // TODO: wrap these two in a transaction
    var tasks = [];
    var self = this;
    if (status === 'accepted') {
      tasks.push(function(cb) {
        self.applyChange(isAdmin, cb);
      });
    }
    tasks.push(function(cb) {
      self.attributes.status = status;
      self.save(function(err) {
        venter.emit('order-change:status:change', self, oldStatus);
        return cb(err);
      });
    });

    utils.async.series(tasks, callback);
  },

  applyChange: function(isAdmin, callback) {
    var self = this;
    var json = self.attributes.order_json;
    Order.findOne(self.attributes.order_id, function(err, order) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      if (!order) return res.json(404);
      order.getOrderItems();
      var old = order.toJSON();
      var removedIds = utils.difference(utils.pluck(old.orderItems, 'id'), utils.pluck(json.order_items, 'id'));

      var tasks = [
        // update order
        function(cb) {
          utils.extend(order.attributes, self.attributes.order_json);
          order.save(utils.compose(cb, utils.identity));
        }
      ];

      // add new items and update exisiting ones
      tasks = tasks.concat(utils.map(json.orderItems, function(orderItem) {
        var model = new OrderItem(orderItem);
        return function(cb) {
          return model.save(utils.compose(cb, utils.identity));
        };
      }));

      // remove deleted order items
      tasks = tasks.concat(utils.map(removedIds, function(id) {
        var model = new OrderItem({id: id});
        return utils.bind(model.destroy, model);
      }));

      utils.async.parallel(tasks, callback);
    });
  }
}, {
  table: 'order_changes',
  getChange: function(order, isAdmin, callback) {
    if (callback === undefined) {
      callback = isAdmin;
      isAdmin = false;
    }
    var self = this;

    var tasks = [
      function(next) {
        // Get or pass through the order
        return order instanceof Order ? next(null, order) : Order.findOne(order, next);
      },
      function(order, next) {
        // make sure the order has order items
        if (order == null)
          return next(404);
        // Check if change can be made.  Order must be in accepted state and still be cancelable.
        if (!isAdmin && !(order.attributes.status === 'accepted' && order.toJSON().cancelable))
          return next(403);
        if (order.orderItems !== undefined)
          return next(null, order);
        else {
          order.getOrderItems(function(err, items) {
            next(err, order);
          });
        }
      },
      function(order, next) {
        self.findOne({where: {order_id: order.attributes.id, status: 'submitted'}}, function(err, change) {
          if (err) return next(err);
          var orderJson = utils.pick(order.toJSON(), Order.updateableFields.concat('orderItems'))
          if (!change) change = new self({order_id: order.attributes.id, order_json: orderJson, change_summaries: []});
          return next(null, change);
        });
      }
    ];

    utils.async.waterfall(tasks, callback);
  },

  statusFSM: {
    canceled: [],
    submitted: ['canceled', 'denied', 'accepted'],
    denied: [],
    accepted: []
  }
});
