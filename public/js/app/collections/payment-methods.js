define(function(require, exports, module) {
  var Backbone = require('backbone');

  var PaymentMethod = require('../models/payment-method');

  return module.exports = Backbone.Collection.extend({
    model: PaymentMethod,
    comparator: 'id'
  });
});