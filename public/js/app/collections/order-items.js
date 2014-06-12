define(function(require, exports, module) {
  var Backbone = require('backbone');
  var OrderItem = require('../models/order-item');

  return module.exports = Backbone.Collection.extend({
    initialize: function(models, options) {
      this.options = options || {};
      if (options.orderId) this.orderId = options.orderId;
      if (options.edit_token){
        this.each( function( m ){
          m.options.edit_token = edit_token;
        });
      }
    },
    url: function() { return '/orders/' + this.orderId + '/items' },
    model: OrderItem,

    sync: function(method, collection, options) {
      options.url = (method === 'read') ? '/api' + collection.url() : collection.url();

      if ( collection.options.edit_token ) {
        options.data = { edit_token: collection.options.edit_token };
      }

      // break aggressive caching on IE
      // this request provides live updates so dont cache reads
      options.cache = (method !== 'read');
      Backbone.sync.call(this, method, collection, options);
    }
  });
});
