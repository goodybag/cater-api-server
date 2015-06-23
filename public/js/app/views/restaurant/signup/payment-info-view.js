define(function (require, exports, module) {
  var utils = require('utils');
  var spinner = require('spinner');
  var BaseView = require('./base-view');
  var Handlebars = require('handlebars');

  return module.exports = BaseView.extend({
    fieldMap: {
        billing_name   : '.billing-name' // not in db
      , billing_phone  : '.billing-phone'// not in db
      , billing_street : '.billing-street'
      , billing_street2: '.billing-street2'
      , billing_city   : '.billing-city'
      , billing_state  : '.billing-state'
      , billing_zip    : '.billing-zip'
      , terms_name     : '.terms-name' // not in db
      , terms_contact_name: '.terms-contact-name' // not in db
      , terms_date     : '.term-date' // not in db
    }
  , fieldGetter: {

    }
  , submit: function (e) {
      if (e) e.preventDefault();
      this.clearErrors();

      var depositInfo = {
          bank_name: '.bank-name'
        , account_type: '.account-type'
        , account_name: '.account-name'
        , routing_number: '.routing-number'
        , account_number: '.account-number'
      };

      var requiredFields = _.omit(this.fieldMap
        , ['billing_street2', 'billing_phone', 'terms_name'
          ,'terms_contact_name', 'terms_date']);

      if (!this.validateFields(requiredFields)) return;
      if (!this.validateFields(depositInfo, true)) return;

      //TODO: insert deposit info into stripe

      this.model.set(this.getDiff());
      $.ajax({
        type: 'PUT'
      , url: '/api/restaurants/join'
      , dataType: 'JSON'
      , data: { status: 'completed', data: JSON.stringify( this.model.toJSON() )}
      , success: function () {
          console.log('worked');
        }
      , error: function (error) {
          console.error('failed', error);
        }
      });
    }

    // validates against null input values
  , validateFields: function (fields, useClassSelector) {
      for (var f in fields) {
        if(!this.$el.find(fields[f]).val()) {

          var errorOpts = {
            message: 'Please provide a :f'.replace(':f', f.replace('_', ' '))
          };

          useClassSelector ?
            errorOpts['selector'] = '.'+f.replace('_', '-')
            : errorOpts['property'] = f

          this.displayErrors([errorOpts]);
          return false;
        }
      }
      return true;
    }

  })
});
