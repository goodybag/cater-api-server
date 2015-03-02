if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Category = require('../models/category');

  return module.exports = Backbone.Collection.extend({
    model: Category,

    url: function() { return _.result(this.restaurant, 'url') + '/categories' },

    comparator: 'order',

    initialize: function(models, options) {
      if (options && options.restaurant) this.restaurant = options.restaurant;
      this.on('change:order', this.sort, this);
    }
  });
});
