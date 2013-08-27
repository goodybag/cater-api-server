var Category = Backbone.Model.extend({
  initialize: function(attrs, options) {
    attrs = attrs || {};
    options = options || {};

    this.items = attrs.items instanceof Items ? attrs.items : new Items(attrs.items || [], {category: this});
    this.unset('items');

    this.restaurant = options.restaurant instanceof Restaurant ? options.restaurant : new Restaurant(options.restaurant || {id: this.get('restaurant_id')})
    this.unset('restaurant_id');
  },

  urlRoot: function() { return _.result(this.restaurant, 'url') + '/categories'}
});
