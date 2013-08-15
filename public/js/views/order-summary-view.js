var OrderSummaryView = Backbone.View.extend({
  initialize: function(options) {
    this.listenTo(this.model, 'change:sub_total', this.subTotalChange, this);
    this.listenTo(this.model.orderItems, 'add', this.addItem, this);
  },

  addItem: function(model, collection, options) {
    var subview = new OrderItemSummaryView({model: model});
    this.$el.find('.order-items').append(subview.render().el);
  },

  subTotalChange: function(model, value, options) {
    this.$el.find('#subtotal').text((value / 100).toFixed(2));
  }
});
