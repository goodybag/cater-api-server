/**
 * Orders Calendar View
 */

define(function(require, exports, module) {

  // Deps
  var $ = require('jquery');
  var moment = require('moment');
  var FullCalendar = require('fullcalendar');

  // Lib
  var utils = require('utils');
  var notify = require('notify');

  // Bootstrapped data
  var orders = require('data/orders');

  // Views

  // Models

  return module.exports = Backbone.View.extend({
    templates: {
      popover: Handlebars.partials.orders_calendar_popover
    , modal: Handlebars.partials.orders_calendar_modal
    },

    events: {
      'click .btn-filter': 'filterOnClick'
    },

    initialize: function() {
      var this_ = this;

      this.filters = [
        'pending'
      , 'canceled'
      , 'submitted'
      , 'accepted'
      , 'denied'
      , 'delivered'
      ];
      this.setupCalendar();

      // rerender on activating the calendar tab
      $('a[href="#calendar-view"]').on('shown.bs.tab', function (e) {
        this_.render();
      });
    },

    setupCalendar: function() {
      this.$el.fullCalendar({
        dayClick:         this.showModal.bind(this)
        // eventMouseover:   this.hover.bind(this)
      , eventRender:      this.eventRender.bind(this)
      });

      this.render();
    },

    showModal: function(event, jsEvent, view) {
      $('#calendar-modal').modal('toggle');
    },

    /**
     * Hovering over order
     */
    hover: function(event, jsEvent, view) {
      //$(jsEvent.target).tooltip('show');
    },

    /**
     * Triggered while an event is being rendered
     */
    eventRender: function(event, element, view) {

      // Set up tooltip content here
      $(element).popover({
        content: this.templates.popover(utils.omit(event, 'source'))
      , title: '<strong>#' + event.id + '</strong> ' + event.restaurant.name
      , trigger: 'click'
      , placement: 'auto'
      , html: true
      });

      /* hack to avoid popover to open more than on at the same time */
      $(element).click(function(){
        $('.fc-event').not(this).popover('hide'); //all but this
      });

    },

    filterOnClick: function(e) {
      var status = $(e.target).data('status');
      this.toggleStatus(status);
    },

    setFilters: function(statuses) {
      this.filters = statuses;
      this.clear();
      this.render();
    },

    /**
     * Render events filtered by statuses that are toggled on
     */
    render: function() {
      var this_ = this
        , events = orders.getFullCalendarEvents();

      utils.each(events, function(event) {
        if (utils.contains(this_.filters, event.status) ) {
          this_.$el.fullCalendar('renderEvent', event, true);
        }
      });
    },

    /**
     * Clear calendar of all events
     */
    clear: function() {
      this.$el.fullCalendar('removeEvents');
    }
  });
});
