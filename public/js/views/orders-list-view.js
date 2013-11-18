var OrdersListView = Backbone.View.extend({
  events: {
    'click .status-buttons': 'changeFilter'
  },

  statuses: ['pending', 'canceled', 'submitted', 'denied', 'accepted', 'delivered'],

  initialize: function() {
    this.convertUtcDates();
  },

  convertUtcDates: function() {
    _.each(this.$el.find('.date-created'), function(date) {
      var $date = $(date);
      var output = moment.utc($date.html()).local().format('l h:mm A');
      $date.html(output);
    });
  },

  changeFilter: function() {
    var self = this;
    // defered to allow active state to be updated before running
    _.defer(function(e) {
      var activeFilter = self.$el.find('.status-buttons .btn.active').attr('data-status');
      var $ordersList = self.$el.find('.order-list-group .list-group-item');
      $ordersList.addClass('hide');
      (activeFilter === 'all' ? $ordersList : $ordersList.filter('[data-status="' + activeFilter + '"]')).removeClass('hide');
    });
  }
});
