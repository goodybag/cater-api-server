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

      this.startDate = this.$el.find("input[name='startDate']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      }).pickadate('picker');

      this.endDate = this.$el.find("input[name='endDate']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      }).pickadate('picker');
    },

    events: {
      'click .btn-sort-by': 'sortByOnClick'
    , 'change .datepicker': 'poll'
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
      orders = this.filterByDateRange(orders)

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
      this.$el.find('i').removeClass('gb-icon-caret-down');
      $el.addClass('active');
      $el.find('i').addClass('gb-icon-caret-down');
      console.log($el[0]);

      // sort
      this.options.orders.setComparator(sortBy);
      this.poll();
    },

    filterByDateRange: function (orders) {
      var startDate = this.startDate.get();
      var endDate = this.endDate.get();
      if (!(startDate && endDate)) return orders;

      startDate = new Date(startDate);
      endDate = new Date(endDate);

      return utils.filter(orders, function (order) {
        var orderDate = moment( new Date(order.datetime) );
        return orderDate.isBetween(startDate, endDate)
            || orderDate.diff(startDate, 'days') === 0
            || orderDate.diff(endDate, 'days') === 0;
      });
    }
  });
});
