var OrderItemSummaryView = Backbone.View.extend({
  template: Handlebars.partials.order_item_summary,

  events: {
    'click .edit': 'openEditModal',
    'click .remove-order-item-btn': 'destroy'
  },

  initialize: function(options) {
    this.listenTo(this.model, {
      'change': this.render,
      'destroy': this.remove
    }, this);
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },

  openEditModal: function() {
    this.options.itemModalView.provideModel(this.model);
    this.options.itemModalView.show();
  },

  destroy: function() {
    this.model.destroy();
  }
});
