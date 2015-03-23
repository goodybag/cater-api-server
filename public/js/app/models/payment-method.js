if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

/**
 * PaymentMethod Model
 */
define(function(require, exports, module) {
  var Backbone = require('backbone');
  var amanda = require('amanda');

  var PaymentMethod = Backbone.Model.extend({
    schema: {
      type: 'object',
      properties: {}
    },

    balancedSchema: {
      type: 'object',
      properties: {
        card_name: {
          type: 'string'
        }
      , card_number: {
          type: 'string'
        , pattern: /^\d*$/
        , required: true
        , minLength: 15
        , maxLength: 16
        }
      , security_code: {
          type: 'string'
        , pattern: /^\d*$/
        , required: true
        , minLength: 3
        , maxLength: 4
        }
      , postal_code: {
          type: 'string'
        , pattern: /^\d*$/
        , required: false
        , length: 5
        }
      , country_code: {
          type: 'string'
        , required: false
        , minLength: 1
        }
      , expiration_year: {
          type: 'number'
        , required: true
        , minimum: new Date().getFullYear()
        }
      , expiration_month: {
          type: 'number'
        , required: true
        , minimum: 1
        , maximum: 12
        }
      }
    },

    validatorOptions: {
      enforceRequired: true
    , singleError: false
    },

    validator: amanda('json'),

    validate: function(attrs, options) {
      return this.validator.validate(attrs, _.result(this, 'schema'), options || {}, _.identity);
    },

    initialize: function(attrs, options) {
      options = options || {};

      attrs = attrs || {};

      return this;
    },

    urlRoot: function(){
      return [ '/users', this.get('user_id'), 'cards' ].join('/');
    },

    updateStripeAndSave: function(data, callback) {
      var this_ = this;

      // if there is a postal code, then a country code must exist
      if (data.postal_code && !data.country_code)
        return callback('country_code is required if a postal_code is given');

      var error;
      this.validator.validate( data, this.balancedSchema, this.validatorOptions, function( _error ){
        error = _error;
      });

      if ( error ) return callback ( error );

      if (PaymentMethod.getCardType(data.card_number) === 'amex' && !data.postal_code)
        return callback('postal_code is required for amex cards');
        
    },

    updateBalancedAndSave: function(data, callback){
      var this_ = this;

      // if there is a postal code, then a country code must exist
      if (data.postal_code && !data.country_code)
        return callback("country_code is required if a postal_code is given");

      var error;
      this.validator.validate( data, this.balancedSchema, this.validatorOptions, function( _error ){
        error = _error;
      });

      if ( error ) return callback( error );

        // require postal code for amex cards
      if (PaymentMethod.getCardType(data.card_number) == 'amex' && !data.postal_code)
        return callback("postal_code is required for amex cards");

      balanced.card.create( _.omit(data, 'card_name'), function(res) {
        if (res.status !== 201){
          var errors;

          if (res.error.category_code === 'card-declined') {
            errors = [{
              property: 'card_number'
            , message: 'Card Declined. Please check all card details and try again.'
            }];
          } else {
            errors = Object.keys(res.error).map(function(key) {
              return {
                property: key
              , message: res.error[key]
              };
            });
          }

          return callback ? callback( errors ) : notify.error( errors );
        }

        var pm = {
          data:       res.data
        , uri:        res.data.uri
        , type:       res.data._type
        , name:       data.card_name
        , save_card:  data.save_card
        };

        this_.save(pm, {
          wait: true
        , success: function(){ if (callback) callback(null, this); }
        , error: function(model, xhr){
            if (callback) return callback({
              property: 'id'
            , message: 'Something went wrong processing your card. Please check your card details and try again.'
            });
            notify.error("something went wrong");
          }
        });
      });
    },

    isExpired: function(){
      var data = this.get('data');
      var date = new Date();
      return (
        date.getFullYear() > data.expiration_year ||
        date.getFullYear() === data.expiration_year &&
        date.getMonth() + 1 > data.expiration_month
      );
    }
  }, {
    fieldNounMap: {
      card_number: 'Card Number'
    , security_code: 'Security Code'
    , name: 'Card Title'
    , postal_code: 'Postal Code'
    , expiration_year: 'Expiration Year'
    , expiration_month: 'Expiration Year'
    },

    getCardType: function(cardNumber) {

      var cardTypeRegexes = {
        visa: /^4[0-9]{15}$/
      , master: /^5[1-5][0-9]{14}/
      , amex: /^3[47][0-9]{13}$/
      , discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
      };

      for (var type in cardTypeRegexes) {
        if (!cardTypeRegexes.hasOwnProperty(type)) return null;
        if (cardTypeRegexes[type].test(cardNumber)) return type;
      }

      return null;
    }
  });

  module.exports = PaymentMethod;
});
