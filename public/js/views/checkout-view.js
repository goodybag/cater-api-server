// Will probably become the new order view, I just don't want to break the old one yet.
var CheckoutView = FormView.extend({
  events: {
    'change input[type="radio"].payment-method': 'changePaymentMethod',
    'submit #order-form': 'submit'
  },

  fieldMap: {
    // TODO: order fields
  },

  getDiff: function() {
    var diff = FormView.getDiff.apply(this, arguments);
    var addrDiff = this.addressView.getDiff.apply(this.addressView, arguments)
    return diff || addrDiff ? _.extend({}, diff, addrDiff) : null;
  },

  changePaymentMethod: function(e) {
    var $selected = $(e.currentTarget);
    var parent = $selected.attr('data-parent');
    var target = $selected.attr('data-target');

    this.$el.find(parent + ' .in').collapse('hide');
    this.$el.find(target).collapse('show');
  },

  submit: function(e) {
    e.preventDefault();
  }
});
