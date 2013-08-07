var Model = require('./model');
var utils = require('../utils');

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
    var order = this
    Model.prototype.save.call(this, function(err) {
      if (!err && insert) {
        var OrderStatus = require('./order-status');
        var status = new OrderStatus({order_id: order.attributes.id});
        status.save(callback);
      } else
        callback.apply(this, arguments);
    });
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

    Model.find.call(this, query, callback);
  }
});
