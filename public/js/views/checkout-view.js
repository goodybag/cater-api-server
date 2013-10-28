// Will probably become the new order view, I just don't want to break the old one yet.
var CheckoutView = FormView.extend({
  events: {
    'change input[type="radio"].payment-method': 'changePaymentMethod',
    'submit #order-form': 'submit',
    'submit #select-address-form': 'selectAddress'
  },

  fieldMap: {
    datetime: '.order-datetime',
    guests: '#order-guests',
    name: '.order-name',
    notes: '#order-notes',
    // adjustment: '.adjustment .form-control',
    tip: '.order-tip'
  },

  fieldGetters: {
    guests: _.partial(FormView.intGetter, 'guests'),

    tip: _.partial(FormView.dollarsGetter, 'tip'),

    datetime: function() {
      var date = this.$el.find("#order-form #order-date").val().trim();
      var time = this.$el.find("#order-form #order-time").val().trim();
      var datepart = date ? dateTimeFormatter(date) : null;
      var timepart = time ? timeFormatter(time, 'HH:mm:ss') : null;


      if(!datepart || !timepart) return null;

      // since we cannot determine offset, cannot format as ISO 8601 String
      // using "YYYY-MM-DD HH:mm:ss" to represent the date and time
      var datetime = datepart + ' ' + timepart;
      var date = moment(datetime);
      return date.isValid() ? datetime : null;
    }
  },

  getDiff: function() {
    var diff = FormView.prototype.getDiff.apply(this, arguments);
    var addrDiff = this.addressView.getDiff.apply(this.addressView, arguments)
    return diff || addrDiff ? _.extend({}, diff, addrDiff) : null;
  },

  initialize: function(options) {
    this.addressView = new OrderAddressView({el: '.delivery-info', model: this.model.address, orderView: this});
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
    this.onSave();
    // TODO: on success, change status to submitted.
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
