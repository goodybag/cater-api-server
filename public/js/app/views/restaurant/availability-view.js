/**
 * Restaurant Availability View
 *
 * Dependencies:
 *   - collections.restaurant-events // todo: generalize restaurant events?
 */

define(function(require, exports, module) {
  var utils = require('utils');
  var $ = require('jquery');
  var FormView = require('../form-view');
  var FullCalendar = require('fullcalendar');

  var events = require('data/events');
  var restaurant = require('data/restaurant');

  var RestaurantEvent = require('../../models/restaurant-event');

  return module.exports = FormView.extend({
    modalTemplate: Handlebars.partials.restaurant_event_modal,

    events: {
      'click .btn-create-event': 'createEvent'
    },

    fieldMap: {
      name: '.event-name',
      description: '.event-description',
      date_range: '.event-date-range',
      closed: '.event-closed'
    },

    fieldGetters: {
      date_range: function() {
        return this.$el.find(this.fieldMap.date_range).data('date-range');
      },

      closed: function() {
        return this.$el.find(this.fieldMap.closed).is(':checked');
      }
    },

    createEvent: function(e) {
      this.onSave(e, function(err, res) {
        if(err) return console.error('Could not create this event!');
        window.location.reload();
      });
    },

    initialize: function() {

      this.model = new RestaurantEvent({
        restaurant: restaurant
      });

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