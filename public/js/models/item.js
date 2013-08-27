var Item = Backbone.Model.extend({
  urlRoot: '/items',
  initialize: function(attrs, options) {
    if (options && options.category) this.category = options.category;
  }
});
