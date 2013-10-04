var OrdersListView = Backbone.View.extend({
  events: {
    'click .status-buttons': 'changeFilter'
  },

  statuses: ['pending', 'canceled', 'submitted', 'denied', 'accepted', 'delivered'],

  changeFilter: function() {
    var self = this;
    _.defer(function(e) {
      var activeFilter = self.$el.find('.status-buttons .btn.active').attr('data-status');
      var $ordersList = self.$el.find('.order-list-group .list-group-item');
      $ordersList.addClass('hide');
      (activeFilter === 'all' ? $ordersList : $ordersList.filter('[data-status="' + activeFilter + '"]')).removeClass('hide');
    });
  }
});
