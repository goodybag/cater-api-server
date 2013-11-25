var Model = require('./model');
var Order = require('./order.js');

module.exports = Model.extend({}, {
  table: 'order_changes',
  getChange: function(orderId, callback) {
    Order.findOne(orderId, function(err, order) {
      if (err) callback(err);
      if (!order) callback(404);

      // Check if change can be made.  Order must be in accepted state and still be cancelable.
      if (!(order.attributes.status === 'accepted' && order.toJSON().cancelable))
        callback(403);

      this.findOne({order_id: orderId}, function(err, change) {
        if (err) callback(err);
        if (!change) change = new this({order_id: orderId, order_json: order.toJSON()});
        return callback(null, change);
      });
    });
  }
});
