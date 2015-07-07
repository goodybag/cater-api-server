define(function (require, exports, module) {
  var utils = require('utils');
  var spinner = require('spinner');
  var FormView = require('./form-view');
  var CheckoutView = require('./checkout-view');
  var PaymentMethod = require('../models/payment-method');

  return module.exports = CheckoutView.extend({

    events: {
      'submit #payment-form':                         'submit',
      'change input[type="radio"].payment-method':    'changePaymentMethod',
      'change #payment-method-id':                    'onPaymentMethodIdChange',
      'input input[data-stripe="number"]':            'onCardNumberChange'
    },

    fieldMap: {
      payment_method_id: "#payment-method-id"
    },

    initialize: function () {
      this.$paymentMethodId = this.$el.find('#payment-method-id');

      // Trigger payment method id change to check if selected card is expired
      this.onPaymentMethodIdChange();
    },

    submit: function (e) {
      e.preventDefault();
      var this_ = this;
      spinner.start();
      this.clear();

      if (this.$el.find('[name="payment-method"]:checked').val() === 'new') {
        this.saveNewCardAndSubmit(e);
      } else {
        this.updateOrder();
      }

    },
    updateOrder: function (callback) {
        var this_ = this;
        var diff = this.getDiff();

        // set payment_status to null for worker
        this.options.model.set("payment_status", null);

        this.options.model.set(diff);
        this.options.model.save(null, {
          patch: true
        , wait: true
        , validate: false
        , success: function (model, response, options) {
            model.changeStatus('submitted', true, function (error, data) {
              if (error) return notify.error(error);

              spinner.stop();
              this_.$el.find('.alert-success').removeClass('hide');
            });
          }
        , errors: function (model, response, options) {
            spinner.stop();
            this_.$el.find('.alert-danger').removeClass('hide');
          }
        });
    },
    saveNewCardAndSubmit: function (e) {
      var this_ = this;
      var $el = this.$el.find('#new-card');

      this.processCard({
        $el: $el
      , userId: this.options.user.get('id')
      , saveCard: this.$el.find('input[name="save_card"]').is(':checked')
      },
      function(errors, pm) {
        spinner.stop();
        if (errors) return this_.displayErrors(errors, PaymentMethod);

        // Then revert back to "Pay Using" and select the newly added card
        this_.selectPaymentType('existing');
        this_.addNewCardToSelect(pm);
        this_.selectCard(pm.get('id'));
        this_.clearCardForm();

        this_.updateOrder();
      });
    },

    displayErrors: CheckoutView.prototype.displayErrors2,
    getDiff: FormView.prototype.getDiff
  });

});