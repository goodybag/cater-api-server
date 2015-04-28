define(function (require, exports, module) {
  var Backbone  = require('backbone');

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
      var fields = this.getFieldValues();

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
  });
});