define(function(require, exports, module) {
  var Backbone = require('backbone');
  var Order = require('../models/order');

  return module.exports = Backbone.Collection.extend({
    model: Order,
    comparator: 'id',
    getFullCalendarEvents: function() {
      return this.invoke('getFullCalendarEvent');
    }
  });
});
