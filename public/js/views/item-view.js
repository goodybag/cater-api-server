ItemView = Backbone.View.extend({
  events: {
    'click': 'showModal'
  },

  showModal: function() {
    if (analytics) analytics.track('Click Item', {item_id: this.model.id});
    if ( this.options.orderModel.isFulfillableOrder() ) {
      this.options.itemModalView.provideModel(this.model).show();
    } else {
      var self = this;
      this.options.orderModal.show({
        success: function(model, response, options) {
          self.options.orderModal.hide();
          self.showModal();
        }
      , error: function(){
          alert('sorry we were unable to add item to order, please refresh page and try again');
        }
      });
    }
  }
});
