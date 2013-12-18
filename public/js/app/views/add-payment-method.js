define(function(require, exports, module) {
  var $ = require('jquery');
  var Handlebars = require('handlebars');
  var spinner = require('spinner');

  var OrderView = require('./order-view');

  var Order = require('../models/order');
  var Address = require('../models/address');
  var PaymentMethod = require('../models/payment-method');

  return module.exports = Backbone.View.extend({

    events: {
      'click .btn-add-card': 'saveNewCardAndSubmit'
    },

    // Shouldn't be used a view method
    // Should be used as an event handler
    saveNewCardAndSubmit: function(e) {
      var this_ = this;
      var $el = this.$el.find('#new-card');

      var data = {
        card_name:         $el.find('[name="card_name"]').val()
      , card_number:       $el.find('[name="card_number"]').inputmask('unmaskedvalue')
      , security_code:     $el.find('[name="security_code"]').val()
      , expiration_month: +$el.find('[name="expiration_month"]').val()
      , expiration_year:  +$el.find('[name="expiration_year"]').val()
      , save_card:         $el.find('[name="save_card"]:checked').length === 1
      };

      if (PaymentMethod.getCardType(data.card_number) == 'amex') {
        data = _.extend({
          postal_code: $el.find('[name="postal_code"]').val()
        , country_code: 'USA'
        }
        , data);
      }

      var pm = new PaymentMethod({ user_id: this.options.user.get('id') });

      // Save the card
      pm.updateBalancedAndSave(data, function(error) {
        if (error) return this_.displayErrors2(error, PaymentMethod);

        // Then revert back to "Pay Using" and select the newly added card
        this_.selectPaymentType('existing');
        this_.addNewCardToSelect(pm);
        this_.selectCard(pm.get('id'));
        this_.clearCardForm();

        return _.defer(function(){ this_.submit(e); });
      });
    },


  });
});