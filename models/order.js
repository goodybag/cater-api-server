var Model = require('./model');
var utils = require('../utils');
var uuid  = require('node-uuid');

module.exports = Model.extend({
  getOrderItems: function(callback) {
    var self = this;
    callback = callback || function() {};
    require('./order-item').find(
      {where: {'order_id': self.attributes.id}},
      function(err, results) {
        if (err) return callback(err);
        self.orderItems = results;
        callback(null, results);
      });
  },
  save: function(callback) {
    var insert = this.attributes.id == null;
    if (insert) this.attributes.review_token = uuid.v4();
    var order = this
    Model.prototype.save.call(this, function(err) {
      if (!err && insert) {
        var OrderStatus = require('./order-status');
        var status = new OrderStatus({order_id: order.attributes.id});
        status.save(callback);
      } else
        callback.apply(this, arguments);
    });
  },
  toJSON: function() {
    var obj = utils.omit(Model.prototype.toJSON.apply(this, arguments), ['review_token', 'token_used']);
    if (this.orderItems) obj.orderItems = utils.invoke(this.orderItems, 'toJSON');
    obj.editable = this.attributes.status === 'pending';
    obj.cancelable = utils.contains(['pending', 'submitted'], this.attributes.status);
    return obj;
  }
}, {
  table: 'orders',

  find: function(query, callback) {
    // TODO: alter query to add latest status
    query = query || {};
    query.columns = query.columns || ['*'];

    query.columns.push('latest.status');

    query.joins = query.joins || {};

    query.joins.latest = {
      type: 'left'
    , columns: ['order_id', 'status']
    , on: {
        'order_id': '$orders.id$'
      }
    , target: {
        type: 'select'
      , columns: ['order_id', 'status']
      , table: 'order_statuses'
      , alias: 'statuses'
      , joins: {
          recent: {
            type: 'inner'
          , on: {
              'order_id': '$statuses.order_id$'
            , 'created_at': '$statuses.created_at$'
            }
          , target: {
              type: 'select'
            , table: 'order_statuses'
            , columns: ['order_id', 'max(created_at) as created_at']
            , groupBy: 'order_id'
            }
          }
        }
      }
    };

    query.columns.push('totals.sub_total');

    query.joins.totals = {
      type: 'left'
    , columns: ['order_id', 'sub_total']
    , on: {'order_id': '$orders.id$'}
    , target: {
        type: 'select'
      , columns: ['order_id', 'sum(price * quantity) as sub_total']
      , table: 'order_items'
      , groupBy: 'order_id'
      }
    };

    query.columns.push('restaurants.name');

    query.joins.restaurants = {
      type: 'inner'
    , on: {'id': '$orders.restaurant_id$'}
    }

    Model.find.call(this, query, function(err, orders) {
      if (!err) {
        utils.each(orders, function(order) {
          order.attributes.restaurant = {
            id: order.attributes.restaurant_id,
            name: order.attributes.name
          };
          delete order.attributes.name;
        });
      }
      callback.call(this, err, orders);
    });
  },

  // this is a FSM definition
  statusFSM: {
    canceled: [],
    pending: ['canceled', 'submitted'],
    submitted: ['canceled', 'denied', 'accepted'],
    denied: [],
    accepted: ['delivered'],
    delivered: []
  }
});
