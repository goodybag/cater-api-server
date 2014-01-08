/**
 * Restaurant Availability View 
 *
 * Handles the calendar for a restaurant's holidays or time off. 
 * Allows marking events 
 * so that admins are not able to place orders during 
 * specified days.
 *
 * Note: dates should use the postgres canonical form
 * `[)` which is inclusive lower bound, exclusive upper bound
 *
 * Dependencies:
 *   - collections.restaurant-events // todo: generalize restaurant events?
 */

define(function(require, exports, module) {
  var utils = require('utils');
  var notify = require('notify');
  var $ = require('jquery');
  var FormView = require('../form-view');
  var FullCalendar = require('fullcalendar');

  var restaurantEvents = require('data/events');
  var restaurant = require('data/restaurant');
  var moment = require('moment');

  var RestaurantEvent = require('../../models/restaurant-event');

  return module.exports = FormView.extend({
    templates: {
      addEventModal:    Handlebars.partials.restaurant_add_event_modal
    , editEventModal:   Handlebars.partials.restaurant_edit_event_modal
    },

    events: {
      'click .btn-create-event': 'createEvent'
    , 'click .btn-remove-event': 'removeEvent'
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

    initialize: function() {

      // cache dom objects
      this.$calendar = this.$el.find('#calendar');

      // set up
      this.setupCalendar();
    },

    setupCalendar: function() {
      var fcEvents = restaurantEvents.toFullCalendarEvents();
      this.$calendar.fullCalendar({
        events:         fcEvents
      , eventClick:     this.displayEvent.bind(this)
      , selectable:     true
      , select:         this.select.bind(this)
      , unselect:       this.unselect
      });
    },

    /**
     * Convert RestaurantEvents into FullCalendar.Event format
     */
    convertEvents: function() {
      return restaurantEvents.map(function(event) {
        return event.toFullCalendarEvent();
      });
    },

    displayEvent: function(calEvent, jsEvent, view) {
      // var restaurantEvent = restaurantEvents.get(calEvent.id);
      console.log(calEvent);
      var html = this.templates.editEventModal(calEvent);
      this.renderModal(html);
    },

    createEvent: function(e) {
      var this_ = this;
      this.model = new RestaurantEvent({restaurant_id: restaurant.id});
      this.onSave(e, function(err, res) {
        if(err) return console.error('Could not create this event!');
        this_.$calendar.fullCalendar( 'renderEvent', this.model.toFullCalendarEvent() );
      });
    },

    removeEvent: function(e) {
      // TODO: implement removal
      var this_ = this
        , restaurantId = $(e.target).data('id')
        , restaurantEvent = restaurantEvents.get(restaurantId);

      restaurantEvent.destroy({
        success: function(model, response, options) {
          this_.$calendar.fullCalendar('removeEvents', restaurantId);
          this_.toggleModal('hide');
        },

        error: function(model, xhr, options) {
          notify.error('Unable to remove event');
        }
      });

    },

    select: function(startDate, endDate, allDay, jsEvent, view) {
      var html = this.templates.addEventModal({
        start: startDate
      , end:  moment(endDate).add('days', 1)
      });
      this.renderModal(html);
    },

    unselect: function(view, jsEvent) {
      // TODO: Not used, do we need?
    },

    renderModal: function(html) {
      this.$el.find('.modal-container').html(html);
      this.toggleModal('show');
    },

    /**
     * @param {string} option - one of toggle|show|hide, defaults toggle
     */
    toggleModal: function(option) {
      this.$el.find('#restaurant-event-modal').modal(option || 'toggle');
    }
  });
});