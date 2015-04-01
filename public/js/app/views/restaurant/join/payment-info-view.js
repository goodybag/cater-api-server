define(function (require, exports, module) {
  var utils = require('utils');
  var spinner = require('spinner');
  var BaseView = require('./base-view');
  var Handlebars = require('handlebars');

  return module.exports = BaseView.extend({
    fieldMap: {
      , billing_name : '' // not in db
      , billing_phone: ''// not in db
      , billing_street: ''
      , billing_street2: ''
      , billing_city : ''
      , billing_state: ''
      , billing_zip  : ''
      , terms_name   : '' // not in db
      , terms_contact_name: '' // not in db
      , terms_date: '' // not in db
    }
  , fieldGetter: {

    }
  , initialize: function () {

    }
  , submit: function (e) {
      e.preventDefault();
    }

  })
});
