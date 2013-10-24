var OrderAddressView = AddressView.extend({
  events: {
    'click .toggle-edit': 'toggleEditAddress',
    'click .save-address': 'saveAddress'
  },

  initialize: function(options) {
  },

  toggleEditAddress: function(e) {
    this.$el.find('.order-address').toggleClass('hide');
  },

  saveAddress: function(e) {
    var self = this;
    this.options.orderView.onSave(function(err, response) {
      self.render();
    });
  }
});
