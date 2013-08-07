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

  find: function(query, callback) {
    // TODO: alter query to add latest status
    Model.prototype.find.apply(this, arguments);
  }
}, {table: 'orders'});
