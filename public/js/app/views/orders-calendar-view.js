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

  return module.exports = Backbone.View.extend({
    templates: {
      detailsPopover: Handlebars.partials.orders_calendar_details_popover
    , createPopover: Handlebars.partials.orders_calendar_create_popover
    },

    events: {
      'click .btn-search': 'searchOnClick'
    },

    initialize: function() {
      var this_ = this;

      this.$calendar = this.$el.find('#calendar');

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

      // click outside popover to close
      $(document).click(function(e) {
        $('.fc-day, .fc-event').each(function () {
          if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            if ($(this).data('bs.popover').tip().hasClass('in')) {
              $(this).popover('toggle');
            }
            
            return;
          }
        });
      });
    },

    setupCalendar: function() {
      this.$calendar.fullCalendar({
        viewRender:       this.viewRender.bind(this)
      , dayRender:        this.dayRender.bind(this)
      , eventRender:      this.eventRender.bind(this)
      });

      this.render();
    },

    viewRender: function(view, element) {

      // Remove orphaned dom elements
      $('.popover').remove();
    },

    dayRender: function(date, cell) {
      var date = moment(date);

      var $cell = $(cell);

      // activate popover
      $cell.popover({
        content: this.templates.createPopover({date: date.format('YYYY-MM-DD')})
      , title: '<strong>Create order on ' + date.format('MMM Do') + '</strong>' + '<button class="close">&times</button>'
      , trigger: 'click'
      , placement: 'auto'
      , html: true
      , container: '#main'
      });

      // popover DOM isn't added until a date is clicked, so hook into
      // this event
      $(cell).on('shown.bs.popover', function (e) {

        // activate pickatime plugin
        $('.popover .time')
          .pickatime({
            format: 'hh:i A'
          , interval: 15
          })
          .pickatime('picker');

        // listen to close buttons
        $('.popover button.close').click(function() {
          $cell.popover('toggle');
        });
      });

    },

    /**
     * Triggered while an event is being rendered
     */
    eventRender: function(event, element, view) {

      // Activate popover
      $(element).popover({
        content: this.templates.detailsPopover(utils.omit(event, 'source'))
      , title: '<strong>#' + event.id + '</strong> ' + event.restaurant.name + '<button class="close">&times</button>'
      , trigger: 'click'
      , placement: 'auto'
      , html: true
      , container: 'body'
      });

      $(element).on('shown.bs.popover', function (e) {

        // listen to close buttons
        $('.popover button.close').click(function() {
          $(element).popover('toggle');
        });
      });
    },

    searchOnClick: function(e) {
      e.preventDefault();
      var params = {
        date: this.$el.find('#date').data('date')
      , time: this.$el.find('#time').val()
      , zip: this.$el.find('#zip').val()
      , guests: this.$el.find('#guests').val()
      };

      window.location.href = '/restaurants?' + $.param(params);
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
          this_.$calendar.fullCalendar('renderEvent', event, true);
        }
      });
    },

    /**
     * Clear calendar of all events
     */
    clear: function() {
      this.$calendar.fullCalendar('removeEvents');
    }
  });
});
