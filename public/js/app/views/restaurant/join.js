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
    , 'click .add-days'               : 'addDays'
    , 'click .datetime-days-list > li': 'addDeliveryHours'
    , 'click .btn-continue'           : 'saveAndContinue'
    }

    //The majority of the fields apply to restaurants,
    // any field related to the user will have the
    // format user_{field name}
  , fieldMap: {
      user_name    : '.user-name'
    , user_phone   : '.user-phone'
    , user_email   : '.user-email'
    , name         : '.restaurant-name'
    , websites     : '.restaurant-website'
    , services     : '' // not in db
    , yelp_url     : '' // not in db
    , cuisine      : ''
    , price        : ''
    , street       : ''
    , city         : ''
    , state        : ''
    , zip          : ''
    , display_phone: ''
    , billing_email: ''
    , meal_style   : ''
    , tags         : ''
    , amenities    : '' // map to restaurant
    , menu         : '' // not in db (requires file uploader)
    , logo_url     : '' //(requires file uploader)
    , minimum_order: ''
    , contacts     : ''
    , gb_fee       : '' // this may be the wrong column
    , pickup_lead_time: '' // (require some extra mapping)
    , delivery_times: '' // (require some extra mapping)
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
  , fieldGetters: {

    }
  , initialize: function () {
      console.log('init');

      //expose model for _dev_
      window.model = this.model;

      // TODO: use local storage to store restaurant data
      this.store = window.localStorage;

      //this.model.set(this.store.getItem('gb_restaurant'));
      // TODO: use cookies to store view state
      this.step = 1;

      this.deliveryHoursStart = this.$el.find("input[name='time']").pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');

      this.deliveryHoursEnd = this.$el.find("input[name='time']").pickatime({
        format: 'h:i A'
      , interval: 15
      }).pickatime('picker');

      this.deliveryHoursStart.on( 'set', _(this.onTimePickerSet).bind(this) );
      this.deliveryHoursEnd.on( 'set', _(this.onTimePickerSet).bind(this) );
    }

  , saveAndContinue: function (e) {
      if (e) {
        e.preventDefault();
      }

      if ( this.step >= this.options.steps ) {
        // submit form
        return;
      }
      this.startValidations(function (errors) {
        if (errors) {
          return console.log(errors)
          // display errors
        }
        return this.updateModel(function () {});
      }.bind(this));

    }

  , updateModel: function (callback) {
    }

  , startValidations: function (callback) {
      // runs validation based on the form's step number
      var self = this;
      return [
          function (done) {
            var errors = self.validateFields(['name', 'websites'], self.getDiff());
            done(errors);
          }
        , function () {

          }
        , function () {

          }
        , function () {

          }
        ][ 0 ](callback);
    }

  , validateFields: function (keys, diff) {
      // only validates specified keys in the
      // model schema
      var schema = {
        type: this.model.schema['type']
      , properties: {}
      };
      keys.forEach(function (k) {
        if (k in this.model.schema.properties){
          schema['properties'][k] = this.model.schema.properties[k];
        }
      });
      return this.model.validator.validate(diff, schema, function (errors) {
        return errors;
      });
    }

  , addLeadTime: function(e) {
      if (e) e.preventDefault();
      this.$el.find('.lead-times-list').append(Handlebars.partials.lead_time({}));
    }
  , addContact: function (e) {
      if (e) e.preventDefault();
      this.$el.find('.contact-list').append(Handlebars.partials.restaurant_contact_info_fields({}));
    }
  , addDays: function (e) {
      if (e) e.preventDefault();
      console.log('adding delivery days')
    }
  , addHours: function (e) {
      if (e) e.preventDefault();
    }
  , addDeliveryHours: function (e) {
      if (e) e.preventDefault();
      var $el = $(e.target);
      console.log('click', $el.data('day'))
      $el.toggleClass('active');
      //this.set('hours_of_operation', hours)
    }


  , onTimePickerSet: function( ctx ){
      console.log(ctx)
      if ( 'select' in ctx ){
      }
    }

  });
});
