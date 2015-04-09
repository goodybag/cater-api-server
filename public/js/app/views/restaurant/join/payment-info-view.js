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
  , initialize: function (options) {
      BaseView.prototype.initialize.apply(this, options);
    }
  , submit: function (e) {
      if (e) e.preventDefault();

      // validate against null input values
      var requiredFields = _.omit(this.fieldMap
        , ['billing_street2', 'billing_phone']);

      for (var field in requiredFields) {
        if(!this.$el.find(requiredFields[field]).val()) {
          return this.displayErrors([{
            property: field
          , message: 'Please provide a :f'.replace(':f', field.replace('_', ' '))
          }]);
        }
      }

      //this.model.set(this.getDiff());
      //this.model.save(null {});
    }

  })
});
