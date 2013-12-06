define(function(require, exports, module) {
  var Backbone = require('backbone');

  module.exports = Backbone.Collection.extend({
    model: Address,
    comparator: 'id'
  });
});