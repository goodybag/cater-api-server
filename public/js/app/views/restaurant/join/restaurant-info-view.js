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
      , address      : '.restaurant-address' // map to fields (street, city, state, zip)
      , display_phone: '.restaurant-phone'
      , billing_email: '.restaurant-email'
      , meal_type    : '.meal-type'
      , tags         : '.restaurant-tags'
      , amenities    : '.restaurant-amenities' // map to restaurant
      , menu         : '.restaurant-menu' // not in db (requires file uploader)
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
        return $(this.fieldMap.price+':checked').val() || null;
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
      },

      amenities: function () {
        var amenities = [];
        this.$el.find(this.fieldMap.amenities).each(function (i, el) {
          if ( $(el).is(':checked') ) {
            amenities.push({ amenities: el.value });
          }
        });
        return amenities;
      },

      display_phone: function () {
        return this.$el.find(this.fieldMap.display_phone).val().replace(/[^\d]/g, '') || null;
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
  , initialize: function (options) {
      BaseView.prototype.initialize.apply(this, options);
      console.log('init restaurant view')
    }

  , submit: function (e) {
      e.preventDefault();
      this.clearErrors();
      var fields = {
          address: this.$el.find(this.fieldMap.address).val()
        , phone: this.fieldGetters.display_phone.call(this)
        , orderMinimum: this.$el.find(this.fieldMap.minimum_order).val()
        , contacts: this.fieldGetters.contacts.call(this)
      };

      if (!fields.address) {
        return this.displayErrors([{
          property: 'address'
        , message: 'Please provide a valid address.'
        }]);
      }

      if (fields.phone === null || fields.phone.length < 10) {
        return this.displayErrors([{
          property: 'display_phone'
        , message: 'Please provide a valid phone number.'
        }]);
      }

      if (!fields.orderMinimum || !parseInt(fields.orderMinimum)) {
        return this.displayErrors([{
          property: 'minimum_order'
        , message: 'Please provide a valid order minimum.'
        }]);
      }

console.log( fields.contacts );
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




      //todo: validate contacts. check first contact group
      // if an additional contact is empty ingore it

console.log('diff ', this.getDiff());
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
      }.bind(this));
    }
  , uploadMenu: function (e) {
      if (e) e.preventDefault();
      if (!filepicker) return;
      filepicker.pick(function (blob) {
        this.model.set('menu_url', blob.url);
      }.bind(this));
    }
  });
});