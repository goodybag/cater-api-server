var CheckoutView = OrderView.extend({
  events: _.extend({}, OrderView.prototype.events, {
    'click .btn-cancel': 'cancel',
    'change input[type="radio"].payment-method': 'changePaymentMethod',
    'submit #order-form': 'submit',
    'submit #select-address-form': 'selectAddress'
  }),

  fieldMap: {
    payment_method_id: '[name="payment_method_id"]'
  },

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

    // If they're saving a new card, delegate to the `savenewCardAndSubmit` handler
    if (this.$el.find('[name="payment-method"]:checked').val() === 'new') {
      return this.saveNewCardAndSubmit(e);
    }

    var self = this;
    this.onSave(function(err, response) {
      if (err) return notify.error(err); // TODO: error handling
      self.model.changeStatus('submitted', function(err, data) {
        if (err) return notify.error(err); // TODO: error handling
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
  },

  cancel: function() {
    this.model.changeStatus('canceled', function(err, data) {
      if (err) return alert(err); // TODO: error handling
      window.location.reload();
    });
  },

  /**
   * Adds a new card view to the payment methods select element
   * @param {PaymentMethod} paymentMethod The card model
   */
  addNewCardToSelect: function(paymentMethod){
    this.$el.find('[name="payment_method_id"]').append([
      '<option value="'
    , paymentMethod.get('id')
    , '">Credit Card (**** '
    , paymentMethod.get('data').last_four
    , ')</option>'
    ].join(''));
    return this;
  },

  /**
   * Selects the payment method option specified by ID
   * @param  {Number} id ID of the payment_method
   */
  selectCard: function(id){
    this.$el.find('[name="payment_method_id"] > option[value="' + id + '"]').attr('selected', true);
    return this;
  },

  /**
   * Saves the data with balanced, creates a new PaymentMethod model instance
   * and saves that to the Cater API
   * @param  {Object}   data     The card specified by balanced
   * @param  {Function} callback callback(error, paymentMethod)
   */
  saveNewCard: function(data, callback) {
    balanced.card.create(data, function(res) {
      if (res.status !== 201) return callback ? callback(res.error) : notify.error(res.error);

      var paymentMethod = new PaymentMethod({
        data:     res.data
      , uri:      res.data.uri
      , type:     res.data._type
      , user_id:  user.get('id')
      });

      paymentMethod.save(null, {
        wait: true
      , success: function(){ if (callback) callback(null, paymentMethod); }
      , error: function(model, xhr){
          if (callback) return callback("something went wrong");
          notify.error("something went wrong");
        }
      });
    });
  },

  /**
   * Selects the payment info method. Valid options are defined
   * by the values of the radio inputs name="payment-method"
   *
   * existing|new|invoice
   *
   * @param  {[type]} type [description]
   * @return {[type]}      [description]
   */
  selectPaymentType: function(type){
    // Use click so the change event handlers a called
    this.$el.find('[name="payment-method"][value="' + type + '"]').trigger('click');
    return this;
  },

  /**
   * Clears all inputs elements in the new card form
   */
  clearCardForm: function(){
    this.$el.find('#new-card input').val('');
    return this;
  },

  saveNewCardAndSubmit: function(e) {
    var this_ = this;

    var data = {
      card_number:      +this.$el.find('[name="card_number"]').val()
    , security_code:    +this.$el.find('[name="security_code"]').val()
    , expiration_month: +this.$el.find('[name="expiration_month"]').val()
    , expiration_year:  +this.$el.find('[name="expiration_year"]').val()
    };

    // Save the card
    this.saveNewCard(data, function(error, paymentMethod) {
      if (error) return notify.error(error);

      // Then revert back to "Pay Using" and select the newly added card
      this_.selectPaymentType('existing');
      this_.addNewCardToSelect(paymentMethod);
      this_.selectCard(paymentMethod.get('id'));
      this_.clearCardForm();

      return _.defer(function(){ this_.submit(e) });
    });
  }
});
