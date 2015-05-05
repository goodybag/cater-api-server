define(function (require, exports, module) {
  var utils = require('utils');
  var BaseView = require('./base-view');
  var spinner = require('spinner');

  return module.exports = BaseView.extend({

    fieldMap: {
        user_name    : '.user-name'
      , user_phone   : '.user-phone'
      , user_email   : '.user-email'
      , name         : '.restaurant-name'
      , websites     : '.restaurant-website'
      , services     : '.restaurant-services' // not in db
    }

  , fieldGetters: {
      services: function () {
        return this.$el.find(this.fieldMap.services+':checked').val() || null;
      }
    }

  , initialize: function (options) {
      BaseView.prototype.initialize.apply(this, options);
      console.log('init basic info view');
    }

  , submit: function (e) {
      e.preventDefault();
      var this_ = this;
      this.clearErrors();

      if (!this.$el.find(this.fieldMap.name).val()) {
        return this.displayErrors([{
          property: 'name'
        , message: 'Please provide a restaurant name.'
        }]);
      }

      if (!this.fieldGetters.services.call(this)) {
        return this.displayErrors([{
          property: 'services'
        , message: 'Tell us which service you can provide.'
        }]);
      }

      this.model.set(this.getDiff());

      $.ajax({
        type: 'POST'
      , url: '/api/restaurants/join'
      , dataType: 'JSON'
      , data: { step: 2, data: JSON.stringify( this.model.toJSON() )}
      , success: function ( data ) {
          // set restaurant signup id
          this_.setCookie(data.id);
          this_.$el.animate({
            left: '-100px',
            opacity: '0'
          }, 300, function () {
            window.scrollTo(0,0);
            window.location.reload();
          });
        }
      , error: function ( error ) {
          console.log('failed', error);
        }
      })

    }
  });
});