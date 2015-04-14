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
      this.setLocalStorage(this.model.toJSON());
      this.setCookie('2');
      window.location.reload();
    }
  });
});