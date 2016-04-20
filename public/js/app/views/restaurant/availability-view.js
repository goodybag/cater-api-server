/**
 * Restaurant Availability View
 *
 * Handles the calendar for a restaurant's holidays or time off.
 * Allows marking events so that admins are not able to place orders during
 * specified days.
 */

define(function(require, exports, module) {

  // Deps
  var $ = require('jquery');
  var moment = require('moment');
  var FullCalendar = require('fullcalendar');
  var Handlebars = require('handlebars');

  // Lib
  var utils = require('utils');
  var notify = require('notify');

  // Bootstrapped data
  var restaurantEvents = require('data/events');
  var restaurant = require('data/restaurant');

  // Views
  var FormView = require('../form-view');

  // Models
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
      during: '.event-during',
      closed: '.event-closed',
    },

    fieldGetters: {
      during: function() {
        var $during = this.$el.find(this.fieldMap.during);
        var duringStart = $during.find('.event-date-start').text();
        var duringEnd = $during.find('.event-date-end').text();

        return [
          '['
        , moment(duringStart).format('YYYY-MM-DD')
        , ', '
        , moment(duringEnd).format('YYYY-MM-DD')
        , ')'
        ].join('');
      },

      closed: function() {
        return this.$el.find(this.fieldMap.closed).is(':checked');
      }
    },

    initialize: function() {
      this.$calendar = this.$el.find('#calendar');
      this.setupCalendar();
      // prevent formview from tripping up on calling back on save
      this.options.validate = false;
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
      this.model.set({
        'edit': true            // display the 'edit' version of the modal
      , 'calEvent': calEvent    // save object for updating full calendar
      });
      var html = this.templates.eventModal(this.model.toFullCalendarEvent());
      this.renderModal(html);
    },

    createEvent: function(e) {
      var this_ = this;
      this.model = new RestaurantEvent({restaurant_id: restaurant.id});
      this.onSave(e, function(err, res) {
        if(err) return notify.error('Could not create this event!');

        // Update data model, collection
        this.model.set(res);
        restaurantEvents.push(this.model);

        // Update UI
        this_.$calendar.fullCalendar( 'renderEvent', this.model.toFullCalendarEvent() );
        this_.toggleModal('hide');
      });
    },

    updateEvent: function(e) {
      var this_ = this;
      this.onSave(e, function(err, res) {
        if(err) return notify.error('Could not create this event!');

        // Update data model
        this.model.set(res);

        // Update cal event model
        var calEvent = this.model.get('calEvent');
        calEvent.title = this.model.get('name');

        // Update UI
        this_.$calendar.fullCalendar( 'updateEvent', calEvent );
        this_.toggleModal('hide');
      });
    },

    removeEvent: function(e) {
      var this_ = this
        , eventId = this.model.get('id');

      this.model.destroy({
        success: function(model, response, options) {
          this_.$calendar.fullCalendar('removeEvents', eventId);
          this_.toggleModal('hide');
          restaurantEvents.remove(this_.model);
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
