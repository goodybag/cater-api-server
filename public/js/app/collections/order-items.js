define(function(require, exports, module) {
  var Backbone = require('backbone');
  var OrderItem = require('../models/order-item');
  var config = require('config');

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

    setFetchInterval: function() {
      var this_ = this;
      var data = this.edit_token ?
        { data: $.param({ edit_token: this.edit_token }) } : null;

      this.intervalId = setInterval(this.fetch.bind(this, data), config.menuRefresh);
    },

    clearFetchInterval: function() {
      clearInterval(this.intervalId);
    },

    url: function() { return '/api/orders/' + this.orderId + '/items' },
    model: OrderItem,

    sync: function(method, model, options) {
      options.url = (method === 'read') ? '/api' + model.url() : model.url();

      // break aggressive caching on IE
      // this request provides live updates so dont cache reads
      options.cache = (method !== 'read');

      Backbone.sync.call(this, method, model, options);
    }
  });
});
