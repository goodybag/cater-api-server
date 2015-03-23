define(function (require, exports, module) {
  var utils = require('utils');
  var FormView = require('../form-view');

  return module.exports = FormView.extend({
    events: {
      'click .add-lead-time': 'addLeadTime'
    , 'click .add-contact'  : 'addContact'
    , 'click .add-hours'    : 'addHours'
    , 'click .btn-continue' : 'saveAndContinue'
    }
  , initialize: function () {
      console.log('init');
    }

  , saveAndContinue: function (e) {
      if (e) e.preventDefault();
    }

  , addLeadTime: function(e) {
      if (e) e.preventDefault();
      this.$el.find('.lead-times-list').append(Handlebars.partials.lead_time({}));
    }
  , addContact: function (e) {
      if (e) e.preventDefault();

    }
  , addHours: function (e) {
      if (e) e.preventDefault();

    }
  });
});
