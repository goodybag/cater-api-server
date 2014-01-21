define(function(require, exports, module) {
  var Backbone = require('backbone');
  var RestaurantEvent = require('../models/restaurant-event');

  return module.exports = Backbone.Collection.extend({
    model: RestaurantEvent,
    comparator: 'id',

    toFullCalendarEvents: function() {
      return this.invoke('toFullCalendarEvent');
    }
  });
});
