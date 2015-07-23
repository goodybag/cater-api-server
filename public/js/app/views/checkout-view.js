define(function(require, exports, module) {
  var $ = require('jquery');
  var Handlebars = require('handlebars');
  var spinner = require('spinner');
  var utils = require('utils');
  var notify = require('../../notify');
  var config = require('config');

  var OrderView = require('./order-view');

  var Order = require('../models/order');
  var Address = require('../models/address');
  var PaymentMethod = require('../models/payment-method');

  var CheckoutView = OrderView.extend({
    events: function(){
      return _.extend({}, OrderView.prototype.events.call( this ), {
        'click .item-edit':                             'itemEditClick',
        'click  #cancel-confirm-modal .btn-cancel':     'cancel',
        'click  .btn-expired-update':                   'onExpiredUpdateClick',
        'click  #update-card .btn-cancel':              'onUpdateCardCancelClick',
        'click  #update-card .btn-submit':              'onUpdateCardSubmitClick',
        'change input[type="radio"].payment-method':    'changePaymentMethod',
        'change #payment-method-id':                    'onPaymentMethodIdChange',
        'submit #order-form':                           'submit',
        'submit #select-address-form':                  'selectAddress',
        'keyup #order-guests':                          'updateGuests',
        'input input[data-stripe="number"]':            'onCardNumberChange',
        'change input[name="organization_type"]':       'onOrganizationTypeChange'
      })
    },

    step: 2,

    fieldMap: _.extend({}, OrderView.prototype.fieldMap, {
        payment_method_id: '#payment-method-id'
      , datetime: '.order-datetime'
      , guests: '#order-guests'
      , street: '.address-street'
      , name: '#order-name'
      , city: '.address-city'
      , state: '.address-state'
      , zip: '.address-zip'
      , notes: '#order-notes'
      , phone: '.address-phone'
      , tip: '.order-tip'
      , tip_percent: '.tip-percent'
      , organization_type: '.organization-type'
      , secondary_contact_phone: '.order-secondary-contact-phone'
      , promo_code: '.promo-code'
    }),

    fieldGetters: _.extend({}, OrderView.prototype.fieldGetters, {
      payment_method_id: function() {
        var existingCardSelected = this.$el.find('.payment-method[value="existing"]:checked').length;
        var pmid = this.$el.find(this.fieldMap.payment_method_id).val();
        return existingCardSelected ? pmid : null;
      },

      organization_type: function () {
        return this.$el.find('input[name="organization_type"]:checked').val();
      },

      secondary_contact_phone: function () {
        return this.$el.find(this.fieldMap.secondary_contact_phone).val().replace(/[^\d]/g, '') || null;
      },

      promo_code: function () {
        var code = this.$el.find(this.fieldMap.promo_code).val();
        return code ? code.toLowerCase() : null;
      }
    }),

    patch: true,
    setThenSave: false,

    errorTypeMessages: {
      required: 'Please enter a valid {noun}'
    },

    initialize: function() {
      OrderView.prototype.initialize.apply(this, arguments);

      this.datepicker = this.$el.find('.checkout-form input[name="date"]').pickadate({
        format: 'mm/dd/yyyy'
      , min: new Date()
      }).pickadate('picker');

      this.datepicker.on( 'open', _(this.onDatePickerOpen).bind( this ) );

      this.timepicker = this.$el.find('.checkout-form input[name="time"]').pickatime({
        format: 'hh:i A'
      , interval: 15
      }).pickatime('picker');

      this.timepicker.on( 'open', _(this.onTimePickerOpen).bind( this ) );
      // Handle discrepancy between pickadates and moments formatting
      this.timepickerMomentFormat = this.timepicker.component.settings.format.replace( /\i/g, 'mm' );

      this.$paymentMethodId = this.$el.find('#payment-method-id');

      // Trigger payment method id change to check if selected card is expired
      this.onPaymentMethodIdChange();

      this.$orderOrganization = this.$el.find('#order-organization');

      this.model.on('change:datetime', this.updateDatetime, this);
    },

    updateDatetime: function(order) {
      var datetime = order.attributes.datetime.split(' ');
      this.datepicker.set('select', datetime[0], { format: 'yyyy-mm-dd' });
      this.timepicker.set('select', datetime[1], { format: 'HH:i' });
    },

    convertTimesToRanges: function(){
      var timeFormat = this.timepickerMomentFormat;

      this.timepicker.$root.find('.picker__list-item').each( function(){
        var $this = $(this);
        var range = utils.timeToRange( $this.text(), timeFormat, config.deliveryTime );
        $this.text( range.join(' - ') );
      });
    },

    onDatePickerOpen: function(){
      this.datepicker.set( 'disable', this.model.restaurant.getDaysClosed() );
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

      this.convertTimesToRanges();
    },

    itemEditClick: function(e) {
      e.preventDefault();
      this.showMenu();
    },

    showMenu: function() {
      // TODO edit order item should show item modals instead of redirecting page
      window.location = this.model.url() + '/add-items';
    },

    changePaymentMethod: function(e) {
      var $selected = $(e.currentTarget);
      var parent = $selected.attr('data-parent');
      var target = $selected.attr('data-target');

      this.$el.find(parent + ' .in').collapse('hide');
      this.$el.find(target).collapse('show');
    },

    clear: function() {
      this.$el.find('.has-error').removeClass('has-error');
      this.$el.find('.alert').addClass('hide');
    },

    submit: function(e) {
      if ( utils.contains(['accepted', 'submitted'], this.model.get('status')) ) {
        return;
      }

      spinner.start();

      var self = this, userInfo;

      var tasks = {
        formSave: utils.bind( this.onSave, this )
      };

      if (e) e.preventDefault();

      this.clear();

      // Check to see if we need to validate the address
      if ( !this.$el.find('.order-address.edit').hasClass('hide') ){
        var errors = this.validateAddress();
        if ( errors ){
          spinner.stop();
          return this.displayErrors2(errors, Address);
        }
      }

      var secondaryContactPhone = this.$el.find('.order-secondary-contact-phone').val().replace(/[^\d]/g, '');

      if ( secondaryContactPhone.length > 0 && secondaryContactPhone.length < 10 ) {
          spinner.stop();
          return this.displayErrors2([{
            property: 'secondary_contact_phone'
          , message: 'Please enter a valid phone number'
          }]);
      }

      if ( this.$el.find('[name="user_name"]').length ){
        userInfo = {
          name:         this.$el.find('[name="user_name"]').val()
        , organization: this.$el.find('[name="user_organization"]').val()
        , organization_type: this.$el.find('input[name="organization_type"]:checked').val()
        };

        if ( !userInfo.name ){
          spinner.stop();
          return this.displayErrors2([{
            property: 'user_name'
          , message: 'Please enter a valid name'
          }]);
        }

        if( !userInfo.organization_type ){
          spinner.stop();
          return this.displayErrors2([{
            property: 'organization_type'
          , message: 'Please select an organization type'
          }]);
        }

        if ( !userInfo.organization)
        if( userInfo.organization_type === "business"){
          spinner.stop();
          return this.displayErrors2([{
            property: 'user_organization'
          , message: 'Please enter an organization'
          }]);
        }

        tasks.userSave = function( done ){
          self.options.user.save( userInfo, {
            success:  function(){ done(); }
          , validate: false
          , patch:    true
          , error:    function(c){
              done({
                property: 'user_name'
              , message: 'Something went wrong setting your name. Please refresh and try again'
              });
            }
          });
        };
      }

      // If they're saving a new card, delegate to the `savenewCardAndSubmit` handler
      if (this.$el.find('[name="payment-method"]:checked').val() === 'new') {
        return this.saveNewCardAndSubmit(e);
      }

      // If they were editing an existing card, delegate to `onUpdateCardSubmitClick` handler
      if (!this.$el.find('#update-card').hasClass('hide')){
        return this.onUpdateCardSubmitClick(e);
      }

      utils.async.parallel(tasks, function( err, results ){
        spinner.stop();

        if (err) {
          var error = err.responseJSON && err.responseJSON.error ? err.responseJSON.error : null;
          if ( error && error.name === 'INVALID_ADDRESS' ){
            return self.displayErrors2([{
              property: 'street'
            , message: 'Please enter a valid address'
            }]);
          }

          return notify.error(err);
        }

        self.model.changeStatus('submitted', true, function(err, data) {
          if (err) return notify.error(err); // TODO: error handling

          analytics.track('Order Submitted');
          window.location.reload();
        });
      });
    },

    selectAddress: function(e) {
      var this_ = this;
      e.preventDefault();
      var addressId = this.$el.find('#select-address-form input[name="address-radio"]:checked').data('id');
      var address = this.options.user.addresses.get(addressId);

      // NOTE: this used to be this.model.save(...)
      this.model.address.set(address.omit(['id', 'user_id', 'is_default']));
      this.$el.find('#select-address-modal').modal('hide');
      this.clear();
      this.addressView.render();
    },

    cancel: function() {
      this.model.changeStatus('canceled', true, function(err, data) {
        if (err) return alert(err); // TODO: error handling
        window.location.reload();
      });
    },

    removeCCLogos: function () {
      this.$cardNumber.removeClass('cc-visa cc-discover cc-master cc-amex');
      return this;
    },

    hidePostalCode: function() {
      this.$postalCode.closest('.row').addClass('hide');
      return this;
    },

    showPostalCode: function() {
      this.$postalCode.closest('.row').removeClass('hide');
      return this;
    },

    clearPostalCode: function() {
      this.$postalCode.val('');
      return this;
    },

    onCardNumberChange: function(e) {
      this.$newCard = this.$newCard || this.$el.find('#new-card');
      this.$cardNumber = this.$cardNumber || this.$newCard.find('input[data-stripe="number"]');
      this.$postalCode = this.$postalCode || this.$newCard.find('input[name="postal_code"]');

      var cardNumber = this.$cardNumber.val();

      var foundMatch = false;
      for(var type in this.cardTypeRegexes) {
        if (!this.cardTypeRegexes.hasOwnProperty(type)) return;

        var cardType = this.cardTypeRegexes[type];

        // TODO: improve later - apply input mask and change logo only if the card type changes
        if (cardType.likely.test(cardNumber)) {
          foundMatch = true;
          this.$cardNumber.inputmask(cardType.mask, {
            placeholder:" "
          , oncleared: function() {
              this.$cardNumber.inputmask('remove');
              this.removeCCLogos();
              this.hidePostalCode();
            }.bind(this)
          , onincomplete: function() {
              this.$cardNumber.inputmask('remove');
              this.removeCCLogos();
            }.bind(this)
          });

          this.removeCCLogos();
          this.$cardNumber.addClass('cc-'+type);

          if (type == 'amex')
            this.showPostalCode();
          else
            this.hidePostalCode();
          break;
        }
      }

      if (!foundMatch){
        $(e.target).inputmask('remove');
        this.removeCCLogos()
          .clearPostalCode()
          .hidePostalCode();
      }
    },

    /**
     * Adds a new card view to the payment methods select element
     * @param {PaymentMethod} paymentMethod The card model
     */
    addNewCardToSelect: function(paymentMethod){
      this.$paymentMethodId.append(
        Handlebars.partials.payment_method_option(
          paymentMethod.toJSON()
        )
      );

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
      $el.find('input').val('');
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
      this.$el.find('#update-card .btn-submit').attr( 'type', 'submit' );

      return this;
    },

    /**
     * Hide update card view
     */
    hideUpdateCardView: function(){
      this.$el.find('#update-card').addClass('hide');
      this.$el.find('.btn-expired-update').removeClass('hide');
      this.$el.find('#update-card .btn-submit').attr( 'type', 'button' );

      return this;
    },

    processCard: function (options, callback) {
      if (utils.isFunction(options)) {
        callback = options;
        options = {};
      }

      utils.defaults(options, {
        $el: this.$el.find('#newCard')
      , userId: this.options.user.get('id')
      , paymentId: undefined
      , saveCard: false
      });

      var $el = options.$el;
      var userId = options.userId;

      var data = {
        card_name:         $el.find('[data-stripe="name"]').val()
      , card_number:       $el.find('[data-stripe="number"]').inputmask('unmaskedvalue')
      , security_code:     $el.find('[data-stripe="cvc"]').val()
      , expiration_month: +$el.find('[data-stripe="exp-month"]').val()
      , expiration_year:  +$el.find('[data-stripe="exp-year"]').val()
      , save_card:         options.saveCard
      };

      if (PaymentMethod.getCardType(data.card_number) == 'amex') {
        data = _.extend({
          postal_code: $el.find('[name="postal_code"]').val()
        , country_code: 'USA'
        }
        , data);
      }

      Stripe.card.createToken($el, this.stripeResponseHandler.bind(this, userId, callback));
    },

    saveNewCardAndSubmit: function(e) {
      var this_ = this;
      var $el = this.$el.find('#new-card');

      this.processCard({
        $el: $el
      , userId: this.options.user.get('id')
      , saveCard: $el.find('[name="save_card"]:checked').length === 1
      },
      function(errors, pm) {
        if (errors) return this_.displayErrors2(errors, PaymentMethod);

        // Then revert back to "Pay Using" and select the newly added card
        this_.selectPaymentType('existing');
        this_.addNewCardToSelect(pm);
        this_.selectCard(pm.get('id'));
        this_.clearCardForm();

        return _.defer(function(){ this_.submit(e); });
      });
    },

    stripeResponseHandler: function(user_id, callback, status, response) {
      if ( status !== 200 ) return callback(response.error);

      var pm = new PaymentMethod();

      var props = {
        data: response.card
      , name: response.card.name
      , type: response.type
      , user_id: user_id
      , token_id: response.id
      };

      var opts = {
        success: function() {
          callback(null, pm);
        }, error: function(model, res) {
          callback(res.responseJSON.error);
        }
      };

      pm.save(props, opts);
    },

    validateAddress: function(){
      var address = new Address(), $el, val;
      for ( var i = 0, l = Order.addressFields.length; i < l; ++i ){
        $el = this.$el.find('[name="' + Order.addressFields[i] + '"]');

        if ( !$el.length ) continue;

        val = $el.val();

        if ( !val.length ) continue;

        if ( Order.addressFields[i] === 'phone' ){
          val = val.replace(/\(|\)|\s|\-/g, '');
        }

        address.set( Order.addressFields[i], val );
      }

      return address.validate(address.toJSON());
    },

    /**
     * Displays errors next to the form field pertaining to the error
     *
     * displayErrors2([
     *   { property: 'card_number', message: '`555` is not a valid card number' }
     * ])
     *
     * Or Amanda style errors will be converted:
     *
     * displayErrors2({
     *   '0': {...}
     *   '1': {...}
     * })
     *
     * Optionally pass in a Model that has the fieldNounMap exposed
     * to convert property names to nicer names
     *
     * @param  {Array}  errors Array of error objects
     * @param  {Object} Model  Model to reference for field-noun-map
     */
    displayErrors2: function( errors, Model ){
      // Just in case!
      spinner.stop();

      var this_ = this;
      var error, $el, $parent;
      var template = Handlebars.partials.alert_error;
      var selector = '[name="{property}"], [data-stripe="{property}"]';

      if ( _.isObject( errors ) && !_.isArray( errors ) ){
        // Amanda errors object
        if ( '0' in errors ){
          errors = Array.prototype.slice.call( errors );

          // We're just going to use the `required` error text for everything
          // so just take the unique on error.property
          errors = _.chain(errors).map( function( error ){
            return error.property;
          }).unique().map( function( property ){
            var message;
            var noun = property;

            if ( Model && typeof Model.fieldNounMap === 'object' )
            if ( property in Model.fieldNounMap ){
              noun = Model.fieldNounMap[ property ];
            }

            message = this_.errorTypeMessages.required.replace(
              '{noun}', noun
            );

            return {
              property: property
            , message: message
            };
          }).value();
        } else {
          errors = [ errors ];
        }
      }

      var css = {
        position: 'absolute'
      , top: '11px'
      };

      for ( var i = 0, l = errors.length; i < l; ++i ){
        error = errors[i];

        $el = $( template( error ) );
        $el.css( css );

        $parent = this.$el.find(
          selector.replace( /{property}/g, (error.name || error.param || error.property).toLowerCase().replace(/-/g, '_') )
        ).parents('.form-group').eq(0);

        $parent.prepend( $el );
        $parent.addClass('has-error');

        $el.css( 'right', 0 - $el[0].offsetWidth );
      }

      // Scroll to the first error
      $el = this.$el.find('.has-error');

      if ( $el.length ){
        $('html,body').animate({ scrollTop: $el.eq(0).offset().top - 20 });
      }
    },

    onPaymentMethodIdChange: function(e) {
      var pm = this.options.user.payment_methods.get(this.$paymentMethodId.val());

      if (!pm) return;

      if (pm.isExpired()) this.showCardExpired(pm);
      else this.hideCardExpired();
    },

    onExpiredUpdateClick: function(e) {
      e.preventDefault();
      var pm = this.options.user.payment_methods.get(this.$paymentMethodId.val());

      if (!pm) return;

      this.showUpdateCardView(pm);
    },

    onUpdateCardCancelClick: function(e){
      e.preventDefault();
      this.hideUpdateCardView();
    },

    onUpdateCardSubmitClick: function(e){
      e.preventDefault();

      var this_ = this;
      var $el = this.$el.find('#update-card');

      this.processCard({
        $el: $el
      , user_id: this.options.user.get('id')
      , paymentId: $el.find('[name="id"]').val()
      , saveCard: false
      },
      function(error) {
        if (error) return notify.error(error);

        this_.hideCardExpired();
        this_.hideUpdateCardView();
        this_.selectPaymentType('existing');
        this_.selectCard(pm.get('id'));
        this_.clearCardForm($el);
      });
    },

    onOrganizationTypeChange: function (e) {
      if (e.target.value === "business") {
        this.$orderOrganization.removeClass('hide');
      } else {
        this.$orderOrganization.addClass('hide');
      }
    },

    cardTypeRegexes: {
      visa: {
        likely: /^4/
      , valid: /^4[0-9]{15}$/
      , mask: '9999 9999 9999 9999'
      }
    , master: {
        likely: /^5[1-5]/
      , valid: /^5[1-5][0-9]{14}/
      , mask: '9999 9999 9999 9999'
      }
    , amex: {
        likely: /^3[47]/
      , valid: /^3[47][0-9]{13}$/
      , mask: '9999 999999 99999'
      }
    , discover: {
        likely: /^6(?:011|5[0-9]{2})/
      , valid: /^6(?:011|5[0-9]{2})[0-9]{12}$/
      , mask: '9999 9999 9999 9999'
      }
    }
  });

  module.exports = CheckoutView;
  return module.exports;
});
