define(function(require, exports, module) {
  var utils  = require('utils');
  var Order  = require('../models/order');

  return module.exports = utils.Collection.extend({
    model: Order
  , comparator: 'priority'
  });
});
