define(function(require, exports, module) {
  var Backbone = require('backbone');

  module.exports = Backbone.Collection.extend({
    model: Category,

    url: function() { return _.result(this.restaurant, 'url') + '/categories' },

    comparator: 'order',

    initialize: function(models, options) {
      if (options && options.restaurant) this.restaurant = options.restaurant;
      this.on('change:order', this.sort, this);
    }
  });
});