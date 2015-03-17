define(function(require, exports, module) {
  var $ = require('jquery');
  var Handlebars = require('handlebars');
  var spinner = require('spinner');
  var utils = require('utils');

  var PaymentMethod = require('../../models/payment-method');

  return module.exports = Backbone.View.extend({

    events: {
      'click .btn-add-card':                          'submit',
      'click .btn-remove-card':                       'showRemoveCardModal',
      'input input[name="card_number"]':              'onCardNumberChange'
    },

    initialize: function() {
      this.$el.find('.remove-tooltip').tooltip();
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

    onCardNumberChange: function(e) {
      var cardTypeRegexes = {
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

      var $newCard = this.$el.find('#new-card');
      var $cardNumber = $newCard.find('input[name="card_number"]');
      var $postalCode = $newCard.find('input[name="postal_code"]');
      var cardNumber = $cardNumber.val();

      var removeCCLogos = function () {
        $cardNumber.removeClass('cc-visa cc-discover cc-master cc-amex');
      };

      var foundMatch = false;
      for(type in cardTypeRegexes) {
        if (!cardTypeRegexes.hasOwnProperty(type)) return;

        var cardType = cardTypeRegexes[type];

        // TODO: improve later - apply input mask and change logo only if the card type changes
        if (cardType.likely.test(cardNumber)) {
          foundMatch = true;
          $cardNumber.inputmask(cardType.mask, {
            placeholder:" "
          , oncleared: function() {
              $cardNumber.inputmask('remove');
              removeCCLogos();
              $postalCode.closest('.row').addClass('hide');
            }
          , onincomplete: function() {
              $cardNumber.inputmask('remove');
              removeCCLogos();
            }
          });

          removeCCLogos();
          $cardNumber.addClass('cc-'+type)
          ;

          if (type == 'amex') {
            $postalCode.closest('.row').removeClass('hide');
          } else {
            $postalCode.closest('.row').addClass('hide');
          }
          break;
        }
      }

      if (!foundMatch){
        $(e.target).inputmask('remove');
        $cardNumber.removeClass('cc-visa cc-discover cc-master cc-amex');
        $postalCode.val('');
        $postalCode.closest('.row').addClass('hide');
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
      var selector = '[name="{property}"]';

      if ( _.isObject( errors ) && !_.isArray( errors ) ){
        // Amanda errors object
        if ( '0' in errors ){
          errors = Array.prototype.slice.call( errors )

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
          selector.replace( '{property}', error.property )
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
        card_name:         $el.find('[name="card_name"]').val()
      , card_number:       $el.find('[name="card_number"]').inputmask('unmaskedvalue')
      , security_code:     $el.find('[name="security_code"]').val()
      , expiration_month: +$el.find('[name="expiration_month"]').val()
      , expiration_year:  +$el.find('[name="expiration_year"]').val()
      , save_card:         options.saveCard || false 
      };

      if (PaymentMethod.getCardType(data.card_number) == 'amex') {
        data = _.extend({
          postal_code: $el.find('[name="postal_code"]').val()
        , country_code: 'USA'
        }
        , data);
      }

      var pm = new PaymentMethod({ user_id: userId, id: paymentId });
      pm.updateBalancedAndSave(data, function (errors) {
        callback(errors, pm);
      });
    },

    saveNewCardAndSubmit: function(e) {
      var this_ = this;
      var $el = this.$el.find('#new-card');

      this.processCard({
        $el: $el
      , userId: this.options.user.get('id')
      , saveCard: true 
      }, 
      function(errors) {
        spinner.stop();
        if (errors) return this_.displayErrors(errors, PaymentMethod);
        return window.location.reload();
      });
    },
  });
});
