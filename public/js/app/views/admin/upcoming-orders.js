define(function(require){
  var utils = require('utils');
  var $ = require('jquery-loaded');
  var Handlebars = require('handlebars');
  var moment = require('moment');

  return utils.View.extend({
    template: Handlebars.partials.upcoming_rows,

    initialize: function() {
      this.$tbody = this.$el.find('tbody');
      this.start();

      this.$filterMessage = this.$el.find(".filter-message");

      this.startDate = this.$el.find("input[name='start-date']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      }).pickadate('picker');

      this.endDate = this.$el.find("input[name='end-date']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      }).pickadate('picker');

      this.startTime = this.$el.find("input[name='start-time']").eq(0).pickatime({
          format: 'hh:i A'
        , interval: 15
      }).pickatime('picker');

      this.endTime = this.$el.find("input[name='end-time']").eq(0).pickatime({
          format: 'hh:i A'
        , interval: 15
      }).pickatime('picker');

    },

    events: {
      'click .btn-sort-by': 'sortByOnClick'
    , 'change .datepicker': 'poll'
    , 'change .timepicker': 'poll'
    },

    start: function() {
      this.intervalId = setInterval(this.poll.bind(this), this.options.delay || 3000);

      return this;
    },

    stop: function() {
      clearInterval(this.intervalId);
      delete this.intervalId;

      return this;
    },

    poll: function() {
      utils.ajax({ url: this.options.endpoint })
        .done(this.update.bind(this));

      return this;
    },

    update: function(orders) {
      orders = this.filterByDateTimeRange(orders);

      // When resetting, do not check if order needs to be courier or delivery
      // i.e. the order type at initialization should not change
      this.options.orders.reset(orders, { ignoreOrderTypeInit: true });
      this.render();

      return this;
    },

    render: function() {
      var html = this.template({ orders: this.options.orders.toJSON() });
      this.$tbody.html(html);

      return this;
    },

    sortByOnClick: function(e) {
      e.preventDefault();
      var $el = $(e.target);
      var sortBy = $el.data('sort');

      // apply styling
      this.$el.find('.active').removeClass('active');
      $el.addClass('active');

      // sort
      this.options.orders.setComparator(sortBy);
      this.poll();
    },

    setTime: function( date, time ) {
      var hour = parseInt(time.match(/\d+/)[0]);
      var minute = parseInt(time.match(/(\d+)(?=\D+$)/)[0]);
      var period = time.substring(6);

      if( period === "PM" && hour < 12 ) { hour = hour + 12 };
      if( hour === 12 && period === "AM" ) { hour = 0 };

      if( !date ) date = moment();

      return date.set({ 'hour': hour, 'minute': minute });
    },

    filterByDateTimeRange: function (orders) {
      var startDate = this.startDate.get();
      var endDate   = this.endDate.get();
      var startTime = this.startTime.get();
      var endTime   = this.endTime.get();

      // format startDate and endDate
      if( startDate ) startDate = moment(startDate);
      if( endDate )   endDate = moment(endDate);

      // set startTime and endTime
      if( startTime ) startDate = this.setTime( startDate, startTime );
      if( endTime )   endDate = this.setTime( endDate, endTime );

      if(  startDate &&  endDate ) {
        this.$filterMessage.text( "Filtering from " + startDate.format("ddd MMM DD @ hh:mm a")
                                  +  " to " +  endDate.format("ddd MMM DD @ hh:mm a") );
        return utils.filter(orders, function (order) {
          var orderDate = moment( order.datetime );
          return orderDate.isBetween(startDate, endDate);
        });
      } else if(  startDate && !endDate ) {
        this.$filterMessage.text( "Filtering from " + startDate.format("ddd MMM DD @ hh:mm a") );
        return utils.filter(orders, function(order) {
          var orderDate = moment( order.datetime );
          return orderDate.isAfter(startDate);
        });
      } else if( !startDate &&  endDate ) {
        this.$filterMessage.text( "Filtering to " + endDate.format("ddd MMM DD @ hh:mm a") );
        return utils.filter(orders, function(order) {
          var orderDate = moment( order.datetime );
          return orderDate.isBefore(endDate);
        });
      } else {
        return orders;
      };
    }
  });
});
