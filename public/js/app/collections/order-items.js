if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

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

    sync: function(method, model, options) {
      options.url = (method === 'read') ? '/api' + model.url() : model.url();

      if ( this.options.edit_token ){
        options.url += '?edit_token=' + this.options.edit_token;
      }

      // break aggressive caching on IE
      // this request provides live updates so dont cache reads
      options.cache = (method !== 'read');

      Backbone.sync.call(this, method, model, options);
    }
  });
});
