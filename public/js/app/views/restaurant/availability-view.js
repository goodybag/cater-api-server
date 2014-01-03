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
    modalTemplate: Handlebars.partials.restaurant_event_modal,

    initialize: function() {

      // cache dom objects
      this.$calendar = this.$el.find('#calendar');

      // set up
      this.convertEvents();
      this.setupCalendar();
    },

    setupCalendar: function() {
      this.$calendar.fullCalendar({
        events:         events
      , selectable:     true
      , select:         this.select.bind(this)
      , unselect:       this.unselect
      });
    },

    /**
     * Convert RestaurantEvents into FullCalendar.Event format
     */
    convertEvents: function() {
      events = events.map(function(event) {
        var date_range = event.get('date_range');
        // really hacky, the date ranges are stored like
        // [2014-01-15,2014-01-18) in postgres with inclusive, exclusive bounds
        // probably should convert them to timestamp ranges ..
        date_range = date_range.replace( /[\[\]\(\)]/g,'').split(',');;
        return {
          title: event.get('name'),
          start: date_range[0],
          end: date_range[1]
        };
      });
    },

    select: function(startDate, endDate, allDay, jsEvent, view) {
      this.renderModal({start: startDate, end: endDate});
    },

    unselect: function(view, jsEvent) {
      // not in use currently
    },

    renderModal: function(ctx) {
      this.$el.find('.modal-container').html(this.modalTemplate(ctx));
      this.$el.find('#restaurant-event-modal').modal('show');
    }
  });
});