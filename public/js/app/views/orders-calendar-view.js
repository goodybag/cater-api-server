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

    },

    events: {
      'click .btn-filter': 'filterOnClick'
    },

    initialize: function() {
      this.filters = ['pending', 'submitted', 'accepted'];
      this.setupCalendar();
    },

    setupCalendar: function() {
      this.$el.fullCalendar({
        eventClick:       this.viewOrder.bind(this)
      , eventMouseover:   this.hover.bind(this)
      , eventRender:      this.eventRender.bind(this)
      });
      this.render();
    },

    /**
     * Hovering over order
     */
    hover: function(event, jsEvent, view) {
      $(jsEvent.target).tooltip('show');
    },

    /**
     * Triggered while an event is being rendered
     */
    eventRender: function(event, element, view) {

      // Set up tooltip content here
      $(element).tooltip({
        title: event.title
      });
    },

    /**
     * Clicking an order directs user to order page
     */
    viewOrder: function(calEvent, jsEvent, view) {
      window.location.href = '/orders/' + calEvent.orderId;
    },


    filterOnClick: function(e) {
      var status = $(e.target).data('status');
      console.log(status);
      this.toggleStatus(status);
    },

    /**
     * Update list of active filters used to render calendar
     */
    toggleStatus: function(status) {
      if ( utils.contains(this.filters, status) ) {
        this.filters = utils.without(this.filters, status);
      } else {
        this.filters.push(status);
      }
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
