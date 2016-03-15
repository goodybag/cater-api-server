/**
 * Orders Calendar View
 */

define(function(require, exports, module) {

  // Deps
  var $ = require('jquery');
  var utils = require('utils');
  var moment = require('moment');
  var FullCalendar = require('fullcalendar');
  var Handlebars = require('handlebars');
  var user = require('user');
  var Order = require('app/models/order');

  require('jquery-ui');

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
      'submit .create-order-form': 'search'
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

      // rerender on calendar tab
      this.$el.find('a[href="#calendar-view"]').on('shown.bs.tab', function (e) {
        this_.render();
      });

      // click outside popover to close
      $(document).click(function(e) {
        $('.fc-day, .fc-event').each(function () {
          var $this = $(this);
          if (!$this.is(e.target) && $this.has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            if ($this.data('bs.popover') && $this.data('bs.popover').tip().hasClass('in')) {
              $this.popover('toggle');
            }
            return;
          }
        });
      });
    },

    setupCalendar: function() {
      var options = {
        viewRender:       this.viewRender.bind(this)
      , dayRender:        this.dayRender.bind(this)
      , eventRender:      this.eventRender.bind(this)
      , eventDataTransform: function( data ){
          return new Order( data ).getFullCalendarEvent();
        }
      };

      if ( user.groups.indexOf('admin') > -1 ){
        utils.extend( options, {
          editable:         true
        , disableDragging:  false
        , events:           '/api/users/me/orders'
        , eventDrop:        function( e, delta, reverseFn ){
                              this.changeOrderDate( e.id, e._start, function( error ){

                              });
                            }.bind( this )
        });
      }

      this.$calendar.fullCalendar( options );

      this.render();
    },

    onTimePickerOpen: function() {
      // Scroll to 8am initially
      var $scroller = this.$root.find('.picker__holder');
      $scroller[0].scrollTop = $scroller.find('[data-pick="' + (60 * 8) + '"]')[0].offsetTop;
    },

    /**
     * Clean up when changing calendar views
     */
    viewRender: function(view, element) {
      this.$el.find('.popover').remove();
    },

    dayRender: function(date, element) {
      var this_ = this;
      var date = moment(date);
      var $element = $(element);

      // activate popover
      $element.popover({
        content: this.templates.createPopover({
          date: date.format('YYYY-MM-DD')
        })
      , title: [
          '<strong>Create order on '
        , date.format('MMM Do')
        , '</strong>'
        , '<button class="close">&times</button>'
        ].join('')
      , trigger: 'click'
      , placement: 'auto'
      , html: true
      , container: '#main'
      });

      // popover DOM isn't added until a date is clicked,
      // so hook into this event
      $element.on('shown.bs.popover', function (e) {

        // activate pickatime plugin
        this_.$el.find('.popover .time')
          .pickatime({
            format: 'hh:i A'
          , interval: 15
          , onOpen: this_.onTimePickerOpen
          })
          .pickatime('picker');

        // listen to close button
        this_.$el.find('.popover button.close').click(function() {
          $element.popover('toggle');
        });
      });

    },

    /**
     * Triggered while an event is being rendered
     */
    eventRender: function(event, element, view) {
      var this_ = this;
      var $element = $(element);

      // Activate popover
      $element.popover({
        content: this.templates.detailsPopover(utils.omit(event, 'source'))
      , title: [
          '<strong>#'
        , event.id
        , '</strong> '
        , event.restaurant.name
        , '<button class="close">&times</button>'
        ].join('')
      , trigger: 'click'
      , placement: 'auto'
      , html: true
      , container: '#main'
      });

      $element.on('shown.bs.popover', function (e) {

        // listen to close button
        this_.$el.find('.popover button.close').click(function() {
          $element.popover('toggle');
        });
      });
    },

    search: function(e) {
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
     * Render events on the calendar
     */
    render: function() {
      // var this_ = this
      //   , events = orders.getFullCalendarEvents();

      // this.clear();
      // utils.each(events, function(event) {
      //   if (utils.contains(this_.filters, event.status) ) {
      //     this_.$calendar.fullCalendar('renderEvent', event, true);
      //   }
      // });
    },

    /**
     * Clear calendar of all events
     */
    clear: function() {
      this.$calendar.fullCalendar('removeEvents');
    },

    changeOrderDate: function( orderId, date, callback ){
      $.ajax({
        type: 'PUT'
      , url: '/api/orders/' + orderId
      , json: true
      , headers: { 'Content-Type': 'application/json' }
      , data: JSON.stringify({
                datetime: moment( date ).format('YYYY-MM-DD HH:mm:ss')
              })
      , success: function( order ){
          callback( null, order );
        }
      , error: callback
      });
    }
  });
});
