var CheckoutView = OrderView.extend({
  events: _.extend({}, OrderView.prototype.events, {
    'change input[type="radio"].payment-method': 'changePaymentMethod',
    'submit #order-form': 'submit',
    'submit #select-address-form': 'selectAddress'
  }),

  changePaymentMethod: function(e) {
    var $selected = $(e.currentTarget);
    var parent = $selected.attr('data-parent');
    var target = $selected.attr('data-target');

    this.$el.find(parent + ' .in').collapse('hide');
    this.$el.find(target).collapse('show');
  },

  submit: function(e) {
    if (e) e.preventDefault();
    var self = this;
    this.onSave(function(err, response) {
      if (err) return alert(JSON.stringify(err)); // TODO: error handling
      self.model.changeStatus('submitted', function(err, data) {
        if (err) return alert(JSON.stringify(err)); // TODO: error handling
        window.location.reload();
      });
    });
  },

  selectAddress: function(e) {
    e.preventDefault();
    var addressId = this.$el.find('#select-address-form input[name="address-radio"]:checked').attr('data-id');
    var address = this.options.user.addresses.get(addressId);
    this.model.save(address.omit(['id', 'user_id', 'is_default']), {success: function() {
      this.$el.find('#select-address-modal').modal('dismiss');
    }});
  }
});
