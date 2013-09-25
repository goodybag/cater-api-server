ItemView = Backbone.View.extend({
  events: {
    'click': 'showModal'
  },

  showModal: function() {
    if ( this.options.orderModel.isFulfillableOrder() ) {
      var orderItem = orderView.model.orderItems.findWhere({item_id: this.model.id});
      this.options.itemModalView.provideModel(orderItem || this.model).show();
    } else {
      var self = this;
      this.options.orderModal.show({
        success: function(model, response, options) {
          self.options.orderModal.hide();

          var order = new Order(model.attributes);

          // there is a fulfillable order model now, so set it
          self.options.orderModel = order;
          orderView.setModel(order);

          itemModalView.options.orderItems = order.orderItems;
          self.showModal();
        }
      , error: function(){
          alert('sorry we were unable to add item to order, please refresh page and try again');
        }
      });
    }
  }
});