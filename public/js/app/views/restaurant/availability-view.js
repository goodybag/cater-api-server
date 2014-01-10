/**
 * Restaurant Availability View 
 *
 * Handles the calendar for a restaurant's holidays or time off. 
 * Allows marking events so that admins are not able to place orders during 
 * specified days.
 *
 * Note: Date ranges from backend are represented with [ start, end ) 
 * but the frontend calendar plugin uses [ start, end ].
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
      eventModal:    Handlebars.partials.restaurant_event_form_modal
    },

    events: {
      'click .btn-create-event': 'createEvent'
    , 'click .btn-remove-event': 'removeEvent'
    , 'click .btn-update-event': 'updateEvent'
    },

    fieldMap: {
      name: '.event-name',
      description: '.event-description',
      date_range: '.event-date-range',
      closed: '.event-closed',
    },

    fieldGetters: {
      date_range: function() {
        var $date_range = this.$el.find(this.fieldMap.date_range);
        var dateStart = $date_range.find('.event-date-start').text();
        var dateEnd = $date_range.find('.event-date-end').text();

        // convert upper bound for postgres
        // [ start, end ] -> [ start, end )
        return [
          '['
        , moment(dateStart).format('YYYY-MM-DD')
        , ', '
        , moment(dateEnd).add('days', 1).format('YYYY-MM-DD')
        , ')'
        ].join('');
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
      this.$calendar.fullCalendar({
        events:         restaurantEvents.toFullCalendarEvents()
      , eventClick:     this.displayEvent.bind(this)
      , selectable:     true
      , select:         this.select.bind(this)
      , unselect:       this.unselect
      });
    },

    displayEvent: function(calEvent, jsEvent, view) {
      this.model = restaurantEvents.get(calEvent.id);
      this.model.set('edit', true); // display the 'edit' version of the modal
      var html = this.templates.eventModal(this.model.toFullCalendarEvent());
      this.renderModal(html);
    },

    createEvent: function(e) {
      var this_ = this;
      this.model = new RestaurantEvent({restaurant_id: restaurant.id});
      this.onSave(e, function(err, res) {
        if(err) return notify.error('Could not create this event!');

        // Update data model, collection
        this.model.set(res[0]);
        restaurantEvents.push(this.model);

        // Update UI
        this_.$calendar.fullCalendar( 'renderEvent', this.model.toFullCalendarEvent() );
        this_.toggleModal('hide');
      });
    },

    removeEvent: function(e) {
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

    /**
     * Callback for selecting a date range on the calendar
     */
    select: function(startDate, endDate, allDay, jsEvent, view) {
      var html = this.templates.eventModal({
        start: startDate
      , end: endDate
      , edit: false
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