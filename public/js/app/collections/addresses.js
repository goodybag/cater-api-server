define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Address = require('../models/address');

  return module.exports = Backbone.Collection.extend({
    model: Address,
    comparator: 'id'
  });
});