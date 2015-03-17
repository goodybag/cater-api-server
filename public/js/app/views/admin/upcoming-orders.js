define(function(require){
  var utils = require('utils');
  var $ = require('jquery-loaded');
  var Handlebars = require('handlebars');

  return utils.View.extend({
    template: Handlebars.partials.upcoming_rows,

    initialize: function() {
      this.$tbody = this.$el.find('tbody');
      this.start();
    },

    events: {
      'click .btn-sort-by': 'sortByOnClick'
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
      this.options.orders.reset(orders);
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
    }
  });
});
