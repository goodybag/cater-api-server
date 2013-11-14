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
      user: this.options.user,
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
    var diff = this.getDiff(); // changes to address fields
    if (!diff) return this.render();

    var sent = this.options.orderView.model.save(diff, {
      patch: true,
      wait: true,
      success: _.bind(this.render, this),
      error: function(jqXHR, textstatus, errorThrown) {
        // TODO: error handling
        alert(errorThrown);
      }
    })

    if (!sent)
      this.options.orderView.displayErrors();
  }
});
