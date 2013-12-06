define(function(require, exports, module) {
  var Backbone = require('backbone');
  var OrderItem = require('../models/order-item');

  module.exports = Backbone.Collection.extend({
    initialize: function(models, options) {
      if (options && options.orderId) this.orderId = options.orderId;
    },
    url: function() { return '/orders/' + this.orderId + '/items' },
    model: OrderItem
  });
});