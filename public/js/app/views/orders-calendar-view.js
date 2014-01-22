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
      detailsPopover: Handlebars.partials.orders_calendar_details_popover
    , createPopover: Handlebars.partials.orders_calendar_create_popover
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

      $(':not(.popup-marker)').once().click(function(){
        $('.popup-marker').hide(); 
      });

    },

    setupCalendar: function() {
      this.$el.fullCalendar({
        dayRender:        this.dayRender.bind(this)
      , eventRender:      this.eventRender.bind(this)
      });

      this.render();
    },

    dayRender: function(date, cell) {
      var date = moment(date);
      $(cell).popover({
        content: this.templates.createPopover({
          date: {
            query:    date.format('YYYY-MM-DD')
          , display:  date.format('MMM Do')
          }
        })
      , title: '<strong>Create order on ' + date.format('MMM Do') + '</strong>'
      , trigger: 'click'
      , placement: 'auto'
      , html: true
      , container: 'body'
      });

      /* hack to avoid popover to open more than on at the same time */
      $(cell).click(function(){
        $('.fc-event, .fc-day').not(this).popover('hide'); //all but this
      });
    },

    /**
     * Triggered while an event is being rendered
     */
    eventRender: function(event, element, view) {
      // Set up tooltip content here
      $(element).popover({
        content: this.templates.detailsPopover(utils.omit(event, 'source'))
      , title: '<strong>#' + event.id + '</strong> ' + event.restaurant.name
      , trigger: 'click'
      , placement: 'auto'
      , html: true
      , container: 'body'
      });

      /* hack to avoid popover to open more than on at the same time */
      $(element).click(function(){
        $('.fc-event, .fc-day').not(this).popover('hide'); //all but this
      });

    },

    filterOnClick: function(e) {
      var status = $(e.target).data('status');
      this.toggleStatus(status);
    },

    setFilters: function(statuses) {
      this.filters = statuses;
      this.render();
    },

    /**
     * Render events filtered by statuses that are toggled on
     */
    render: function() {
      var this_ = this
        , events = orders.getFullCalendarEvents();

      this.clear();
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
