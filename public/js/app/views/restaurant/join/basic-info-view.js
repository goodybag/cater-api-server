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

  , initialize: function () {
      console.log('init basic info view')
    }

  , submit: function (e) {
      e.preventDefault();

    }
  });
});