var MenuView = Backbone.View.extend({
  events: {
    'click .btn-change-menu': 'changeMenu'
  },

  changeMenu: function(e) {
    e.preventDefault();
    var type = $(e.target).data('type');

    // Hide all categories
    this.$el.find('.menu-category').hide();

    // Show menu category type (full, group, individual)
    this.$el.find('.menu-' + type).show();
  }
});
