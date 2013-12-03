var Model = require('./model');
var Order = require('./order');

module.exports = Model.extend({}, {
  table: 'order_changes',
  getChange: function(orderId, isAdmin, callback) {
    if (callback == null) {
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
        if (!change) change = new self({order_id: orderId, order_json: order.toJSON()});
        return callback(null, change);
      });
    });
  }
});
