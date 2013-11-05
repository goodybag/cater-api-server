var CheckoutView = OrderView.extend({
  events: _.extend({}, OrderView.prototype.events, {
    'change input[type="radio"].payment-method': 'changePaymentMethod',
    'submit #order-form': 'submit',
    'submit #select-address-form': 'selectAddress'
  }),

  initialize: function() {
    OrderView.prototype.initialize.apply(this, arguments);
    this.datepicker = this.$el.find('input[name="date"]').eq(0).pickadate({
      format: 'mm/dd/yyyy'
    , min: new Date()
    }).pickadate('picker');

    this.datepicker.on( 'open', _(this.onDatePickerOpen).bind( this ) );

    this.timepicker = this.$el.find('input[name="time"]').eq(0).pickatime({
      format: 'hh:i A'
    , interval: 15
    }).pickatime('picker');
  },

  onDatePickerOpen: function(){
    // Days of week the restaurant does not deliver
    var disabledTimes = [];

    _(this.model.restaurant.get('delivery_times')).each( function( t, i ){
      if ( t.length === 0 ) disabledTimes.push( ~~i + 1 );
    });

    this.datepicker.set( 'disable', disabledTimes );
  },

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
      if (err) return alert(err); // TODO: error handling
      self.model.changeStatus('submitted', function(err, data) {
        if (err) return alert(err); // TODO: error handling
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
