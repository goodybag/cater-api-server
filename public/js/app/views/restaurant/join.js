define(function (require, exports, module) {
  var utils = require('utils');
  var FormView = require('../form-view');
  var Handlebars = require('handlebars');
  var cookie = require('../../../cookie');

  return module.exports = FormView.extend({
    events: {
      'click .add-lead-time'          : 'addLeadTime'
    , 'click .btn-add-contact'        : 'addContact'
    , 'click .add-hours'              : 'addHours'
    , 'click .datetime-days-list > li': 'addDeliveryHours'
    , 'click .btn-continue'           : 'saveAndContinue'
    }
  , initialize: function () {
      console.log('init');
      // TODO: use local storage to store restaurant data
      this.store = window.localStorage;
      //this.model.set(this.store.getItem('gb_restaurant'));
      // TODO: use cookies to store view state
      this.step = 1;
      debugger;
    }

  , saveAndContinue: function (e) {
      if (e) {
        e.preventDefault();
      }

      if ( this.step >= this.options.steps ) {
        // submit form
        return;
      }

      this.$current = this.getStep( this.step );
      this.$next = this.getStep( this.step + 1 );
      this.$steps = this.$el.find('.form-step');

      this.$steps.addClass('hide');
      this.$next.removeClass('hide')
      this.step++;
    }

  , getStep: function (step) {
      return this.$el.find(
        '.form-step[data-step=":step"]'.replace(':step', step)
      );
    }
  , updateModel: function ( data ) {
    }

  , addLeadTime: function(e) {
      if (e) e.preventDefault();
      this.$el.find('.lead-times-list').append(Handlebars.partials.lead_time({}));
    }
  , addContact: function (e) {
      if (e) e.preventDefault();
      this.$el.find('.contact-list').append(Handlebars.partials.restaurant_contact_info_fields({}));
    }
  , addHours: function (e) {
      if (e) e.preventDefault();
    }
  , addDeliveryHours: function (e) {
      if (e) e.preventDefault();
      console.log('click', e.target.getAttribute('data-day'))
      //this.set('hours_of_operation', hours)
    }
  });
});
