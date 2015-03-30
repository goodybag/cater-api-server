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
    , services     : '.restaurant-services' // not in db
    , yelp_url     : '.yelp-url' // not in db
    , cuisine      : '.restaurant-cuisine'
    , price        : '.restaurant-price'
    , address      : '.restaurant-address' // map to fields (street, city, state, zip)
    , display_phone: '.restaurant-phone'
    , billing_email: '.restaurant-email'
    , meal_type    : '.meal-type'
    , tags         : '.restaurant-tags'
    , amenities    : '.restaurant-amenities' // map to restaurant
    , menu         : '.restaurant-menu' // not in db (requires file uploader)
    , logo_url     : '.restaurant-logo' //(requires file uploader)
    , minimum_order: '.order-minimum'
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
      meal_type: function () {
        var types = [];
        this.$el.find(this.fieldMap.meal_type).each(function (i, el) {
          if ( $(el).is(':checked') ) {
            types.push({ meal_type: el.value });
          }
        });
        return types;
      }
      , tags: function () {
          var tags = [];
          this.$el.find(this.fieldMap.tags).each(function (i, el) {
            if ( $(el).is(':checked') ) {
              tags.push({ tag: el.value });
            }
          });
          return tags;
      }
    }

  , initialize: function () {
      console.log('init');

      //expose stuff for _dev_
      window.model = this.model;
      window.cookie = cookie;

      //restaurant signup view state
      this.cookieName = 'gb_rs';
      this.store = 'gb_restaurant';
      if (localStorage && localStorage.getItem(this.store)) {
        this.model.set(JSON.parse(localStorage.getItem(this.store)));
      }

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

      if ( parseInt(cookie.getItem(this.cookieName)) > this.options.steps - 1 ) {
        // submit form
        return;
      }

      this.startValidations(function (errors) {
        if (errors) {
          this.model.validationError = errors;
          this.displayErrors();
          return console.log(errors)
        }

        this.model.set(this.getDiff());
        if (localStorage) {
          localStorage.setItem( this.store, JSON.stringify(this.model.toJSON()) );
        }

        debugger;
        //update cookie view state
        cookie.setItem(this.cookieName, $('.btn-continue').data('next'));
        window.location.reload();
      }.bind(this));

    }


  , startValidations: function (callback) {
      // runs validation based on the form's step number
      var self = this;
      var step = parseInt(cookie.getItem(this.cookieName)) - 1 || 0;
      console.log(self.getDiff())
      return [
          function (done) {
            var errors = self.validateFields([
                'name'
              , 'websites'
              , 'services'
              ], self.getDiff() );
            done(errors);
          }
        , function (done) {
            var errors = self.validateFields([
                'address'
              , 'display_phone'
              , 'menu'
              , 'logo_url'
              , 'minimum_order'
            ], self.getDiff() );
            done(errors);
          }
        , function (done) {
            done();
          }
        , function (done) {
            done();
          }
        ][ step ](callback);
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
