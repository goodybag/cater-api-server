define(function(require, exports, module) {
  var Backbone = require('backbone');
  var OrderItem = require('../models/order-item');

  return module.exports = Backbone.Collection.extend({
    initialize: function(models, options) {
      if (options && options.orderId) this.orderId = options.orderId;
    },
    url: function() { return '/orders/' + this.orderId + '/items' },
    model: OrderItem,

    sync: function(method, model, options) {
      options.url = (method === 'read') ? '/api' + model.url() : model.url();
      Backbone.sync.call(this, method, model, options);
    }
  });
});
