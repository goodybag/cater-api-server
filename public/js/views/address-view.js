var AddressView = FormView.extend({
  events: {
    'submit .address-edit': 'onSave'
  },

  initialize: function() {
    var this_ = this;

    // Cache elements
    this.$submitBtn = this.$el.find('.address-submit').button();

    this.on('save:success', function() {
      this_.$submitBtn.button('success');
      setTimeout(function() { this_.$submitBtn.button('reset'); }, 2000);
    });

    this.on('save:error', function() {
      this_.$submitBtn.button('error');
      setTimeout(function() { this_.$submitBtn.button('reset'); }, 2000);
    });
  },

  fieldMap: {
    name:     '.address-edit .address-name'
  , street:   '.address-edit .address-street'
  , city:     '.address-edit .address-city'
  , state:    '.address-edit .address-state'
  , zip:      '.address-edit .address-zip'
  }
});
