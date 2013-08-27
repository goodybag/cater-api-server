var Items = Backbone.Collection.extend({
  model: Item,
  url: function() { return _.result(this.category, 'url') + '/items'; },
  initialize: function(models, options) {
    if (options && options.category) this.category = options.category;
  }
});
