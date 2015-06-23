define(function (require, exports, module) {
  var utils = require('utils');
  var BaseView = require('./base-view');
  var Handlebars = require('handlebars');
  var spinner = require('spinner');

  return module.exports = BaseView.extend({
    events: utils.extend(BaseView.prototype.events, {
      'click .btn-add-contact': 'addContact'
    , 'click #input-logo-url': 'uploadLogo'
    , 'click #input-menu-url': 'uploadMenu'
    })
  , fieldMap: {
        yelp_business_id: '.yelp-url'
      , cuisine      : '.restaurant-cuisine'
      , price        : '.restaurant-price'
      , street       : '.restaurant-street'
      , city         : '.restaurant-city'
      , state        : '.restaurant-state'
      , zip          : '.restaurant-zip'
      , display_phone: '.restaurant-phone'
      , billing_email: '.restaurant-email'
      , meal_types   : '.meal-type'
      , tags         : '.restaurant-tags'
      , amenities    : '.restaurant-amenities' // map to restaurant
      , menu_url     : '.restaurant-menu' // not in db (requires file uploader)
      , logo_url     : '.restaurant-logo' //(requires file uploader)
      , minimum_order: '.order-minimum'
      , contacts     : '.contact-group'
    }
  , fieldGetters: {
      cuisine: function () {
        var cuisines = this.$el.find(this.fieldMap.cuisine).val();
        return cuisines ? cuisines.replace(/\s/g, '').split(',') : [];
      },

      price: function () {
        return this.$el.find(this.fieldMap.price+':checked').val() || null;
      },

      meal_types: function () {
        return utils.map(this.$el.find(this.fieldMap.meal_types+':checked'), function (el) {
          return el.value;
        });
      },

      tags: function () {
        return utils.map(this.$el.find(this.fieldMap.tags+':checked'), function (el) {
          return el.value;
        });
      },

      amenities: function () {
        return utils.map(this.$el.find(this.fieldMap.amenities+':checked'), function (el) {
            return el.value;
        });
      },

      display_phone: function () {
        return this.$el.find(this.fieldMap.display_phone).val().replace(/[^\d]/g, '') || null;
      },

      menu_url: function () {
        return this.$el.find(this.fieldMap.menu_url).val() || this.model.get('menu_url');
      },

      logo_url: function () {
        return this.$el.find(this.fieldMap.logo_url).val() || this.model.get('logo_url');
      },

      contacts: function () {
        return utils.map(this.$el.find(this.fieldMap.contacts), function (el) {
          var $el = $(el);
          var phoneNumber = $el.find('.contact-phone').val();
          return {
            name: $el.find('.contact-name').val()
          , position: $el.find('.contact-position').val()
          , phone: phoneNumber
          , sms_phones: [phoneNumber]
          , voice_phones: [phoneNumber]
          , emails: [$el.find('.contact-email').val()]
          };
        });
      }

    }

  , submit: function (e) {
      e.preventDefault();
      var this_ = this;
      this.clearErrors();
      var fields = {
          street: this.$el.find(this.fieldMap.street).val()
        , city: this.$el.find(this.fieldMap.city).val()
        , state: this.$el.find(this.fieldMap.state).val()
        , zip: this.$el.find(this.fieldMap.zip).val()
        , phone: this.fieldGetters.display_phone.call(this)
        , price: this.fieldGetters.price.call(this)
        , menu_url: this.fieldGetters.menu_url.call(this)
        , logo_url: this.fieldGetters.logo_url.call(this)
        , orderMinimum: this.$el.find(this.fieldMap.minimum_order).val()
        , contacts: this.fieldGetters.contacts.call(this)
      };

      if (!fields.price) {
        return this.displayErrors([{
          property: 'price'
        , message: 'Please select a price.'
        }]);
      }

      if (!fields.street) {
        return this.displayErrors([{
          property: 'street'
        , message: 'Please provide a valid street.'
        }]);
      }

      if (!fields.city) {
        return this.displayErrors([{
          property: 'city'
        , message: 'Please provide a valid city.'
        }]);
      }

      if (!fields.state) {
        return this.displayErrors([{
          property: 'state'
        , message: 'Please select a valid state.'
        }]);
      }

      if (!fields.zip) {
        return this.displayErrors([{
          property: 'zip'
        , message: 'Please provide a valid zipcode.'
        }]);
      }

      if (fields.phone === null || fields.phone.length < 10) {
        return this.displayErrors([{
          property: 'display_phone'
        , message: 'Please provide a valid phone number.'
        }]);
      }

      if (!fields.menu_url) {
        return this.displayErrors([{
          property: 'menu_url'
        , message: 'Please provide your restaurant menu'
        }]);
      }

      if (!fields.logo_url) {
        return this.displayErrors([{
          property: 'logo_url'
        , message: 'Please provide your restaurant logo'
        }]);
      }

      if (!fields.orderMinimum || !parseInt(fields.orderMinimum)) {
        return this.displayErrors([{
          property: 'minimum_order'
        , message: 'Please provide a valid order minimum.'
        }]);
      }

      for (var i=0; i < fields.contacts.length; i++) {
        var selector = '.contact-group:nth-child(:g)'.replace(':g', i+2)
        if (!fields.contacts[i].name) {
          return this.displayErrors([{
            selector: selector + ' .contact-name'
          , message: 'Please provide a contact name.'
          }]);
        }

        if (!fields.contacts[i].phone || fields.contacts[i].phone.length < 10) {
          return this.displayErrors([{
            selector: selector + ' .contact-phone'
          , message: 'Please provide a valid phone number.'
          }]);
        }

        if (!fields.contacts[i].emails[0]) {
          return this.displayErrors([{
            selector: selector + ' .contact-email'
          , message: 'Please provide a contact email'
          }]);
        }
      }

      this.model.set(this.getDiff());
      $.ajax({
        type: 'PUT'
      , url: '/api/restaurants/join'
      , data: { step: 3, data: JSON.stringify( this.model.toJSON() )}
      , success: function () {
          this_.$el.animate({
           left: '-100px',
           opacity: '0'
          }, 300, function () {
            window.scrollTo(0,0);
            window.location.reload();
          });
        }
      , error: function (error) {
          console.error('failed ', error);
        }
      });
    }

  , addContact: function (e) {
      if (e) e.preventDefault();
      var contactInfoTemplate = $(Handlebars.partials.restaurant_contact_info_fields({}));
      contactInfoTemplate.insertBefore(this.$el.find('.contact-btn-container'));
    }
  , uploadLogo: function (e) {
      if (e) e.preventDefault();
      if (!filepicker) return;
      filepicker.pick(function (blob) {
        this.model.set('logo_url', blob.url);
        this.$el.find('.logo-url-file').val(blob.filename);
      }.bind(this));
    }
  , uploadMenu: function (e) {
      if (e) e.preventDefault();
      if (!filepicker) return;
      filepicker.pick(function (blob) {
        this.model.set('menu_url', blob.url);
        this.$el.find('.menu-url-file').val(blob.filename);
      }.bind(this));
    }
  });
});