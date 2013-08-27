var Restaurant = Backbone.Model.extend({
  urlRoot: '/restaurants',
  initialize: function(attrs, options) {
    attrs = attrs || {};
    options = options || {};

    this.categories = attrs.categories instanceof Categories ? attrs.categories : new Categories(attrs.categories || [], {restaurant: this});
    this.unset('categories');
  }
});
