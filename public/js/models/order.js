var OrderItems = Backbone.Collection.extend({
  initialize: function(models, options) {
    if (options && options.orderId) this.orderId = options.orderId;
  },
  url: function() { return '/orders/' + this.orderId + '/items' },
  model: OrderItem
});

var Order = Backbone.Model.extend({
  initialize: function(attrs, options) {
    if (this.id) {
      this.orderItems = new OrderItems(attrs.orderItems || [], {orderId: this.id});
      this.unset('orderItems');
      //TODO: maybe get a new collection on id change?
      this.listenTo(this.orderItems, 'change:sub_total add remove', function() {
        this.set('sub_total', _.reduce(this.orderItems.pluck('sub_total'), function(a, b) { return a + b; }, 0));
      }, this);
    }
  }
});
