var CheckoutView = OrderView.extend({
  events: _.extend({}, OrderView.prototype.events, {
    'click .item-edit':                             'itemEditClick',
    'click  #cancel-confirm-modal .btn-cancel':     'cancel',
    'click  .btn-expired-update':                   'onExpiredUpdateClick',
    'click  #update-card .btn-cancel':              'onUpdateCardCancelClick',
    'click  #update-card .btn-submit':              'onUpdateCardSubmitClick',
    'change input[type="radio"].payment-method':    'changePaymentMethod',
    'change #payment-method-id':                    'onPaymentMethodIdChange',
    'submit #order-form':                           'submit',
    'submit #select-address-form':                  'selectAddress'
  }),

  fieldMap: {
    payment_method_id: '#payment-method-id'
  , date: '#order-date'
  , time: '#order-time'
  , guests: '#order-guests'
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

    this.$paymentMethodId = this.$el.find('#payment-method-id');
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

  itemEditClick: function(e) {
    this.showMenu();
  },

  showMenu: function() {
    window.location = this.model.restaurant.url();
  },

  changePaymentMethod: function(e) {
    var $selected = $(e.currentTarget);
    var parent = $selected.attr('data-parent');
    var target = $selected.attr('data-target');

    this.$el.find(parent + ' .in').collapse('hide');
    this.$el.find(target).collapse('show');
  },

  clear: function() {
    this.$el.find('input').parent().removeClass('has-error');
    this.$el.find('.alert').addClass('hide');
  },

  submit: function(e) {
    var self = this;

    if (e) e.preventDefault();

    this.clear();

    //make sure that the required fields are selected
    var blanks = _.chain(['date', 'time', 'guests'])
      .map(function (field) {
        return $(self.fieldMap[field], self.$el).get(0);
      })
      .filter(function (field) {
        return $(field).val()=='';
      })
      .value()
    ;

    if (blanks.length) {
      $(blanks).parent().addClass('has-error');
      self.$el.find('.error-blank-fields').removeClass('hide');
      return;
    }

    // If they're saving a new card, delegate to the `savenewCardAndSubmit` handler
    if (this.$el.find('[name="payment-method"]:checked').val() === 'new') {
      return this.saveNewCardAndSubmit(e);
    }

    // If they were editing an existing card, delegate to `onUpdateCardSubmitClick` handler
    if (!this.$el.find('#update-card').hasClass('hide')){
      return this.onUpdateCardSubmitClick(e);
    }

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
    this.$paymentMethodId.append([
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
    this.$paymentMethodId.find(' > option[value="' + id + '"]').attr('selected', true);
    return this;
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
   * Optional context argument. Defaults to the new-card view
   */
  clearCardForm: function($el){
    $el = $el || this.$el.find('#new-card');
    this.$el.find('input').val('');
    return this;
  },

  /**
   * Shows the expired card message for the specified card (PaymentMethod)
   * @param  {PaymentMethod} paymentMethod The card model
   */
  showCardExpired: function(paymentMethod){
    var $el = this.$el.find('.expired-wrapper');

    $el.find('.expired-text').html(
      Handlebars.partials.checkout_card_expired( paymentMethod.toJSON() )
    );

    $el.removeClass('hide');

    return this;
  },

  /**
   * Hide the expired card message
   */
  hideCardExpired: function(){
    this.$el.find('.expired-wrapper').addClass('hide');
    return this;
  },

  /**
   * Show update card view with the PaymentMethod model
   * @param  {PaymentMethod} paymentMethod data for the view
   */
  showUpdateCardView: function(paymentMethod){
    this.$el.find('#update-card .update-card-wrapper').html(
      Handlebars.partials.edit_card( paymentMethod.toJSON() )
    );

    this.$el.find('#update-card').removeClass('hide');
    this.$el.find('.btn-expired-update').addClass('hide');

    return this;
  },

  /**
   * Hide update card view
   */
  hideUpdateCardView: function(){
    this.$el.find('#update-card').addClass('hide');
    this.$el.find('.btn-expired-update').removeClass('hide');

    return this;
  },

  // Shouldn't be used a view method
  // Should be used as an event handler
  saveNewCardAndSubmit: function(e) {
    var this_ = this;
    var $el = this.$el.find('#new-card');

    var data = {
      card_number:      +$el.find('[name="card_number"]').val()
    , security_code:    +$el.find('[name="security_code"]').val()
    , expiration_month: +$el.find('[name="expiration_month"]').val()
    , expiration_year:  +$el.find('[name="expiration_year"]').val()
    };

    var pm = new PaymentMethod({ user_id: user.get('id') });

    // Save the card
    pm.updateBalancedAndSave(data, function(error) {
      if (error) return notify.error(error);

      // Then revert back to "Pay Using" and select the newly added card
      this_.selectPaymentType('existing');
      this_.addNewCardToSelect(pm);
      this_.selectCard(pm.get('id'));
      this_.clearCardForm();

      return _.defer(function(){ this_.submit(e) });
    });
  },

  onPaymentMethodIdChange: function(e) {
    var pm = user.payment_methods.get(this.$paymentMethodId.val());

    if (!pm) return;

    if (pm.isExpired()) this.showCardExpired(pm);
    else this.hideCardExpired();
  },

  onExpiredUpdateClick: function(e) {
    e.preventDefault();
    var pm = user.payment_methods.get(this.$paymentMethodId.val());

    if (!pm) return;

    this.showUpdateCardView(pm);
  },

  onUpdateCardCancelClick: function(e){
    e.preventDefault();
    console.log("onUpdateCardCancelClick")
    this.hideUpdateCardView();
  },

  onUpdateCardSubmitClick: function(e){
    e.preventDefault();

    var this_ = this;
    var $el = this.$el.find('#update-card');

    var pm = new PaymentMethod({
      user_id: user.get('id')
    , id: $el.find('[name="id"]').val()
    });

    var data = {
      card_number:      +$el.find('[name="card_number"]').val()
    , security_code:    +$el.find('[name="security_code"]').val()
    , expiration_month: +$el.find('[name="expiration_month"]').val()
    , expiration_year:  +$el.find('[name="expiration_year"]').val()
    };

    pm.updateBalancedAndSave(data, function(error) {
      if (error) return notify.error(error);

      this_.hideCardExpired();
      this_.selectPaymentType('existing');
      this_.selectCard(pm.get('id'));
      this_.clearCardForm($el);
    });
  }
});
