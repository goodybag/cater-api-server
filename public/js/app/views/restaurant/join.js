define(function (require, exports, module) {
  var utils = require('utils');
  var FormView = require('../form-view');
  var spinner = require('spinner');
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
      services: function () {
        return this.$el.find(this.fieldMap.services+':checked').val() || null;
      },

      meal_type: function () {
        var types = [];
        this.$el.find(this.fieldMap.meal_type).each(function (i, el) {
          if ( $(el).is(':checked') ) {
            types.push({ meal_type: el.value });
          }
        });
        return types;
      },

      tags: function () {
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
      this.clearErrors();
      spinner.start();

      if ( parseInt(cookie.getItem(this.cookieName)) > this.options.steps - 1 ) {
        // submit form
        return;
      }

      this.startValidations(function (errors) {
        if (errors.length > 0) {
          return;
        }

        this.model.set(this.getDiff());
        if (localStorage) {
          localStorage.setItem( this.store, JSON.stringify(this.model.toJSON()) );
        }

        //update cookie view state
        cookie.setItem(this.cookieName, $('.btn-continue').data('next'));
        spinner.stop();
        window.location.reload();
      }.bind(this));

    }


  , startValidations: function (callback) {
      // runs validation based on the form's step number
      var self = this;
      var step = parseInt(cookie.getItem(this.cookieName)) - 1 || 0;
      return [
          function (done) {
            var errors = self.validateFields([
                {
                  property: 'name'
                , message: 'Please provide a restaurant name.'
                }
              , {
                  property: 'services'
                , message: 'Tell us which service you can provide.'
                }
              ]);

            if (errors) {
              self.displayErrors(errors)
              return done(errors);
            }

            return done(null);
          }
        , function (done) {
            var errors = self.validateFields([
              {
                property: 'address'
              , message: 'Please provide an address'
              }
            , {
                property: 'display_phone'
              , message: 'Please provide a phone number.'
              }
            , {
                property: 'menu'
              , message: 'Please provide a menu.'
              }
            , {
                property: 'logo_url'
              , message: 'Please provide a logo.'
              }
            , {
                property: 'minimum_order'
              , message: 'Please tell us your order minimum.'
              }
            ]);
            if (errors) {
              self.displayErrors(errors)
              return done(errors);
            }
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

  , displayErrors: function( errors ){
      // Just in case!
      spinner.stop();

      var this_ = this;
      var error, $el, $parent;
      var template = Handlebars.partials.alert_error;

       var css = {
        position: 'absolute'
      , top: '-9px'
      };

      for ( var i = 0, l = errors.length; i < l; ++i ){
        error = errors[i];

        $el = $( template( error ) );
        $el.css( css );

        $parent = this.$el.find(
          this.fieldMap[error.property]
        ).parents('.form-group').eq(0);

        $parent.prepend( $el );
        $parent.addClass('has-error');

        $el.css( 'right', 0 - $el[0].offsetWidth );
      }

      // Scroll to the first error
      $el = this.$el.find('.has-error');

      if ( $el.length ){
        $('html,body').animate({ scrollTop: $el.eq(0).offset().top - 20 });
      }
    }
  , clearErrors: function() {
      this.$el.find('.has-error').removeClass('has-error');
      this.$el.find('.alert').addClass('hide');
    }

    /**
    * validateFields()
    *
    * @param {Array} field map keys
    * @return {Array} invalid properties
    */
  , validateFields: function (properties) {
      var errors = [];
      properties.forEach(function (prop) {
        var $el = this.$el.find(this.fieldMap[prop.property]);
        var val = prop.property in this.fieldGetters ? this.fieldGetters[prop.property].call(this) : $el.val();
        if (!val) {
          errors.push(prop);
        }
      }.bind(this));
      return errors;
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
