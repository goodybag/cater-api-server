define(function(require){
  var utils = require('utils');
  var $ = require('jquery-loaded');
  var Handlebars = require('handlebars');

  return utils.View.extend({
    template: Handlebars.partials.upcoming_rows,

    initialize: function() {
      this.$tbody = this.$el.find('tbody');
      this.start();

      this.startDate = this.$el.find("input[name='startDate']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      , min: new Date()
      }).pickadate('picker');

      this.endDate = this.$el.find("input[name='endDate']").eq(0).pickadate({
        format: 'mm/dd/yyyy'
      , min: new Date()
      }).pickadate('picker');
    },

    events: {
      'click .btn-sort-by': 'sortByOnClick'
    , 'click .btn-filter': 'poll'
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
      $el.addClass('active');

      // sort
      this.options.orders.setComparator(sortBy);
      this.poll();
    },

    filterByDateRange: function (orders) {
      var startDate = this.startDate.get();
      var endDate = this.endDate.get();
      if (!(startDate && endDate)) return orders;
      return utils.filter(orders, function (order) {
        return moment(order.datetime).isBetween(startDate, endDate);
      });
    }
  });
});
