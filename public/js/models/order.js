var OrderItems = Backbone.Collection.extend({
  initialize: function(models, options) {
    if (options && options.orderId) this.orderId = options.orderId;
  },
  url: function() { return '/orders/' + this.orderId + '/items' },
  model: OrderItem
});

var Order = Backbone.Model.extend({
  urlRoot: '/orders',
  initialize: function(attrs, options) {
    attrs = attrs || {};
    this.orderItems = new OrderItems(attrs.orderItems || [], {orderId: this.id});
    this.unset('orderItems');
    //TODO: maybe get a new collection on id change?
    this.listenTo(this.orderItems, 'change:sub_total add remove', function() {
      this.set('sub_total', _.reduce(this.orderItems.pluck('sub_total'), function(a, b) { return a + b; }, 0));
    }, this);

    this.on('change:sub_total', function(model, value, options) {
      model.set('below_min', value < model.get('restaurant').minimum_order);
      model.set('submittable', value > 0 && !model.get('below_min'));
    }, this);
  },
  requiredFields: [
    'datetime',
    'street',
    'city',
    'state',
    'zip',
    'phone',
    'guests'
  ],

  toJSON: function() {
    var obj = Backbone.Model.prototype.toJSON.apply(this, arguments);
    obj.orderItems = this.orderItems.toJSON();
    return obj;
  }
});
