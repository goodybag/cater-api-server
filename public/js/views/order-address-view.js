var OrderAddressView = AddressView.extend({
  events: {
    'click .toggle-edit': 'toggleEditAddress',
    'click .cancel-edit-btn': 'render',
    'click .save-address': 'saveAddress',
    'click .add-address': 'addAddress'
  },

  template: Handlebars.partials.order_delivery_info,

  initialize: function(options) {
  },

  render: function() {
    var context = {
      order: this.options.orderView.model.toJSON(),
      states: states
    };
    context.orderAddress = function() {
      return {
        address: context.order,
        states: context.states
      };
    };

    this.$el.html(this.template(context));
  },

  toggleEditAddress: function(e) {
    this.$el.find('.order-address').toggleClass('hide');
  },

  addAddress: function(e) {
    this.$el.find('input').val('');
    this.toggleEditAddress();
  },

  saveAddress: function(e) {
    var self = this;
    this.options.orderView.onSave(function(err, response) {
      if (err)
        ;//TODO: something wen't wrong
      else
        self.render();
    });
  }
});
