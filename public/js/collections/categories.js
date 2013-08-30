var Categories = Backbone.Collection.extend({
  model: Category,

  url: function() { return _.result(this.restaurant, 'url') + '/categories' },

  comparator: 'order',

  initialize: function(models, options) {
    if (options && options.restaurant) this.restaurant = options.restaurant;
    this.on('change:order', this.sort, this);
  }
});
