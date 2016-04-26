define(function(require, exports, module) {
  var $ = require('jquery');
  var Handlebars = require('handlebars');
  var spinner = require('spinner');
  var utils = require('utils');

  var PaymentMethod = require('../../models/payment-method');

  var PaymentMethodsView = Backbone.View.extend({

    events: {
      'click .btn-add-card':                          'submit',
      'click .btn-remove-card':                       'showRemoveCardModal',
      'input input[data-stripe="number"]':            'onCardNumberChange'
    },

    initialize: function() {
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
    },

    showRemoveCardModal: function(e) {
      e.preventDefault();

      var $pm = $(e.target).closest('.payment-method');

      var options = {
        cardId:     $pm.data('card-id')
      , cardInfo:   $pm.find('.payment-method-info').html()
      };
      this.options.removeCardModal.show(options);
    },

    errorTypeMessages: {
      required: 'Please enter a valid {noun}'
    },

    removeCCLogos: function () {
      this.$cardNumber.removeClass('cc-visa cc-discover cc-master cc-amex');
      return this;
    },

    showPostalCode: function() {
      this.$postalCode.closest('.row').removeClass('hide');
      return this;
    },

    hidePostalCode: function() {
      this.$postalCode.closest('.row').addClass('hide');
      return this;
    },

    clearPostalCode: function() {
      this.$postalCode.val('');
      return this;
    },

    onCardNumberChange: function(e) {
      this.$newCard    = this.$newCard || this.$el.find('#new-card');
      this.$cardNumber = this.$cardNumber || this.$newCard.find('input[data-stripe="number"]');
      this.$postalCode = this.$postalCode || this.$newCard.find('input[name="postal_code"]');

      var cardNumber = this.$cardNumber.val();

      var foundMatch = false;
      for (var type in this.cardTypeRegexes) {
        if (this.cardTypeRegexes.hasOwnProperty(type)) {
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
            this.$cardNumber.addClass('cc-' + type);

            if (type == 'amex')
              this.showPostalCode();
            else
              this.hidePostalCode();
            break;
          }
        }
      }

      if ( !foundMatch ){
        $(e.target).inputmask('remove');
        this.removeCCLogos()
            .clearPostalCode()
            .hidePostalCode();
      }
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
    displayErrors: function( errors, Model ){
      // Just in case!
      spinner.stop();

      var this_ = this;
      var error, $el, $parent;
      var template = Handlebars.partials.alert_error;
      var selector = '[data-stripe="{property}"], [data-stripe-alert="{property}"]';

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
      , width: '260px'
      };

      for ( var i = 0, l = errors.length; i < l; ++i ){
        error = errors[i];

        $el = $( template( error ) );
        $el.css( css );

        $parent = this.$el.find(
          selector.replace( /{property}/g, error.name.toLowerCase().replace(/_/g, '-') )
        ).parents('.form-group').eq(0);

        $parent.prepend( $el );
        $parent.addClass('has-error');

        $el.css( 'right', 0 - $el[0].offsetWidth );
      }

      // Scroll to the first error
      $(document.body).animate({ scrollTop: this.$el.find('.has-error').eq(0).offset().top - 20 });
    },

    submit: function(e) {
      e.preventDefault();
      spinner.start();
      this.saveNewCardAndSubmit(e);
    },

    processCard: function (options, callback) {
      if (utils.isFunction(options)) {
        callback = options;
        options = {};
      }

      var $el       = options.$el       || this.$el.find('#newCard');
      var userId    = options.userId    || this.options.user.get('id');
      var paymentId = options.paymentId || undefined;

      var data = {
        number:            $el.find('[data-stripe="number"]').inputmask('unmaskedvalue')
      , cvc:               $el.find('[data-stripe="cvc"]').val()
      , exp_month:        +$el.find('[data-stripe="exp-month"]').val()
      , exp_year:         +$el.find('[data-stripe="exp-year"]').val()
      , save_card:         options.saveCard || false
      };

      if (PaymentMethod.getCardType(data.card_number) == 'amex') {
        _.extend(data, {
          postal_code: $el.find('[name="postal_code"]').val()
        , country_code: 'USA'
        });
      }

      var cardName = $el.find('.credit-card-name').val();

      Stripe.card.createToken(data, this.stripeResponseHandler.bind(this, userId, cardName, callback));
    },

    processCardComplete: function(errors) {
      spinner.stop();
      if (errors) return this.displayErrors(errors, PaymentMethod);
      return window.location.reload();
    },

    saveNewCardAndSubmit: function(e) {
      var this_ = this;
      var $el = this.$el.find('#new-card');

      this.processCard({
        $el: $el
      , userId: this.options.user.get('id')
      , saveCard: true
      }, this.processCardComplete.bind(this));
    },

    stripeResponseHandler: function(user_id, cardName, callback, status, response) {
      if ( status !== 200 ) return callback(response.error);

      var pm = new PaymentMethod();

      var props = {
        data: response.card
      , name: cardName
      , type: response.type
      , user_id: user_id
      , token_id: response.id
      };

      var opts = {
        success: function() {
          callback(null, pm);
        }, error: function(model, response) {
          callback(response.responseJSON.error);
        }
      };

      pm.save(props, opts);
    }
  });

  module.exports = PaymentMethodsView;

  return module.exports;
});
