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
      },
      websites: function () {
        var $websites = this.$el.find(this.fieldMap.websites).val().split(',');
        return $websites ? '{:w}'.replace(':w', $websites.join(',')) : '{}';
      }
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