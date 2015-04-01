define(function (require, exports, module) {
  var utils = require('utils');
  var BaseView = require('./base-view');
  var Handlebars = require('handlebars');
  var spinner = require('spinner');

  return module.exports = BaseView.extend({
    events: {
      'click .btn-add-contact'        : 'addContact'
    }
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
      , contacts     : ''
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
  , initalize: function () {
      console.log('init restaurant view')
    }

  , submit: function (e) {

    }

  , addContact: function (e) {
      if (e) e.preventDefault();
      this.$el.find('.contact-list').append(Handlebars.partials.restaurant_contact_info_fields({}));
    }
  });
});