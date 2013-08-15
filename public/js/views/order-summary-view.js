var OrderSummaryView = Backbone.View.extend({
  initialize: function(options) {
    this.listenTo(this.model.orderItems, {
      'add': this.addItem,
      'change:sub_total': this.subTotalChange
    }, this);
  },

  addItem: function(model, collection, options) {
    var subview = new OrderItemSummaryView({model: model});
    this.$el.append(subview.render().el);
  },

  subTotalChange: function(model, value, options) {
    //TODO: update dom
  }
});
