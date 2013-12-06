define(function(require, exports, module) {
  var Backbone = require('backbone');

  module.exports = Backbone.Collection.extend({
    model: Item,
    url: function() { return _.result(this.category, 'url') + '/items'; },
    initialize: function(models, options) {
      if (options && options.category) this.category = options.category;
      this.on('change:order', this.sort, this);
    },
    comparator: 'order'
  });
});