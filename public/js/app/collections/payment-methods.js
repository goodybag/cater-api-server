define(function(require, exports, module) {
  var Backbone = require('backbone');

  return module.exports = Backbone.Collection.extend({
    model: PaymentMethod,
    comparator: 'id'
  });
});