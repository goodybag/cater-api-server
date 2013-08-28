var Item = Backbone.Model.extend({
  urlRoot: function() { return this.isNew() ? undefined : '/items'; },
  initialize: function(attrs, options) {
    if (options && options.category) this.category = options.category;
  }
});
