define(function(require, exports, module) {
  var Backbone = require('backbone');
  var RestaurantEvent = require('../models/restaurant-event');

  return module.exports = Backbone.Collection.extend({
    model: RestaurantEvent,
    comparator: 'id',

    /**
     * Convert Restaurant Events into array of FullCalendar Event objects
     */
    toFullCalendarEvents: function() {
      return this.map(function(event) {
        return event.toFullCalendarEvent();
      });
    }
  });
});
