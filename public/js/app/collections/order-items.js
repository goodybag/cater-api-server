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
      if( method==='read' ) {
        options.url = '/api' + model.url();
      }

      Backbone.sync.call(this, method, model, options);
    }
  });
});
