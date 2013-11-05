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

    this.timepicker.on( 'open', _(this.onTimePickerOpen).bind( this ) );
  },

  onDatePickerOpen: function(){
    // Days of week the restaurant does not deliver
    var disabledTimes = [];

    _(this.model.restaurant.get('delivery_times')).each( function( t, i ){
      if ( t.length === 0 ) disabledTimes.push( ~~i + 1 );
    });

    this.datepicker.set( 'disable', disabledTimes );
  },

  onTimePickerOpen: function(){
    var day = this.datepicker.get();

    // Build a disabled set of values that matches timepickers format
    var disabled = [];
    for (var i = 0; i < 24; ++i){
      disabled.push( [ i, 0  ] );
      disabled.push( [ i, 15 ] );
      disabled.push( [ i, 30 ] );
      disabled.push( [ i, 45 ] );
    }

    // Initially reset everything
    this.timepicker.set( 'enable', disabled );

    // Don't do anything if we haven't already selected a day
    if ( !day ) return;

    day = new Date( day ).getDay();

    var times = this.model.restaurant.get('delivery_times')[ day ];

    this.timepicker.set(
      'disable'
      // Filter the times down to the ones that should be disabled
    , _(disabled).filter( function( t ){
        // Pad the hh:mm
        var time = [
          ( '0' + t[0] ).slice( -2 )
        , ( '0' + t[1] ).slice( -2 )
        , '00'
        ].join(':');

        // Check that `time` is out of bounds for every delivery_time for the day picked
        return _(times).every( function( t ){
          return time < t[ 0 ] || time > t[ 1 ];
        });
      })
    );
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
