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

    if (this.$el.find('[name="payment-method"]:checked').val()) {
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

  addNewCardToSelect: function(paymentMethod){
    console.log(paymentMethod)
    this.$el.find('[name="payment_method_id"]').append([
      '<option value="'
    , paymentMethod.get('id')
    , '">Credit Card (**** '
    , paymentMethod.get('data').last_four
    , ')</option>'
    ].join(''));
  },

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

  saveNewCardAndSubmit: function(e) {
    var this_ = this;

    var data = {
      card_number:      +this.$el.find('[name="card_number"]').val()
    , security_code:    +this.$el.find('[name="security_code"]').val()
    , expiration_month: +this.$el.find('[name="expiration_month"]').val()
    , expiration_year:  +this.$el.find('[name="expiration_year"]').val()
    };

    this.saveNewCard(data, function(error, paymentMethod) {
      if (error) return notify.error(error);

      this_.addNewCardToSelect(paymentMethod);

      // return this.submit(e);
    });
  }
});
