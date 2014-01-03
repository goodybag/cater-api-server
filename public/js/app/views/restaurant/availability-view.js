/**
 * Restaurant Availability View
 *
 * Dependencies:
 *   - collections.restaurant-events // todo: generalize restaurant events?
 */

define(function(require, exports, module) {
  var utils = require('utils');
  var $ = require('jquery');
  var Backbone = require('backbone');
  var FullCalendar = require('fullcalendar');

  var events = require('data/events');

  return module.exports = Backbone.View.extend({
    initialize: function() {

      // cache dom objects
      this.$calendar = this.$el.find('#calendar');

      // set up
      this.convertEvents();
      this.setupCalendar();
    },

    setupCalendar: function() {
      this.$calendar.fullCalendar({
        events: events
      });
    },

    /**
     * Convert RestaurantEvents into FullCalendar.Event format
     */
    convertEvents: function() {
      events = events.map(function(event) {
        var date_range = event.get('date_range');
        date_range = date_range.replace( /[\[\]\(\)]/g,'').split(',');;
        return {
          title: event.get('name'),
          start: date_range[0],
          end: date_range[1]
        };
      });
    }

  });
});