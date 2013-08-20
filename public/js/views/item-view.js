ItemView = Backbone.View.extend({
  events: {
    'click': 'showModal'
  },

  showModal: function() {
    if (this.options.addItemReady) {
      var orderItem = orderView.model.orderItems.findWhere({item_id: this.model.id});
      this.options.itemModalView.provideModel(orderItem || this.model).show();
    } else {
      this.options.orderParamsModal.modal('show');
    }
  }
});
