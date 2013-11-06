var PaymentMethods = Backbone.Collection.extend({
  model: PaymentMethod,
  comparator: 'id'
});
