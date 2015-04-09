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
      , terms_date: '.term-date' // not in db
    }
  , fieldGetter: {

    }
  , initialize: function (options) {
      BaseView.prototype.initialize.apply(this, options);
    }
  , submit: function (e) {
      e.preventDefault();

      return this.runValidations({exclude: ['billing_street2']});
    }

    // validates against null input values
  , runValidations: function (options) {
      this.clearErrors();
      for (var field in this.fieldMap) {
        if (!~options.exclude.indexOf(field))
        if(!this.$el.find(this.fieldMap[field]).val()) {
          return this.displayErrors([{
            property: field
          , message: 'Please provide a :f'.replace(':f', field.replace('_', ' '))
          }]);
        }
      }
    }

  })
});
