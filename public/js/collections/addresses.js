var Addresses = Backbone.Collection.extend({
  model: Address,
  comparator: 'id'
});
