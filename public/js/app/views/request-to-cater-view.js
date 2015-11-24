define(function (require, exports, module) {
  var Backbone  = require('backbone');
  var Handlebars = require('handlebars');

  return module.exports = Backbone.View.extend({
    events: {
      'submit': 'submit'
    }

  , fieldMap: {
      contact_name: '#request-form-full-name'
    , contact_email: '#request-form-email'
    , contact_phone: '#request-form-phone-number'
    , restaurant_name: '#request-form-restaurant-name'
    }

  , fieldGetter: {
      contact_phone: function () {
        return this.$el.find(this.fieldMap.contact_phone).val().replace(/[^\d]/g, '') || null;
      }
    }

  , initialize: function () {
    }

  , submit: function (e) {
      e.preventDefault();
      this.clearErrors();
      var fields = this.getFieldValues();

      if (fields.contact_phone.length !== 10) {
        return this.displayErrors('contact_phone', 'Please provide a valid phone number.');
      }

      $.ajax({
        type: 'POST'
      , url: '/request-to-be-a-caterer'
      , data: fields
      , success: function () {
          $('.alert-success').removeClass('hide');
        }
      , error: function () {
          $('.alert-error').removeClass('hide');
        }
      });
    }

  , getFieldValues: function () {
      var k, r = {};
      for (k in this.fieldMap) {
        r[k] = k in this.fieldGetter ?
          this.fieldGetter[k].call(this) : this.$el.find( this.fieldMap[k] ).val();
      }
      return r;
    }

  , displayErrors: function (name, message) {
      var template = Handlebars.partials.alert_error;
      var $el = $( template( { message: message } ) );
      var $parent = this.$el.find('[name="' + name + '"]').closest('.form-group');

      $el.css({
        'position': 'absolute'
      , 'top': '11px'
      , 'left': '338px'
      , 'min-width': '200px'
      , 'width': '100%'
      , 'z-index': '1'
      })

      $parent.prepend( $el );
      $parent.addClass('has-error');
    }

  , clearErrors: function() {
      this.$el.find('.has-error').removeClass('has-error');
      this.$el.find('.alert').addClass('hide');
    }
  });
});