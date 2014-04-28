define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({

    events: {
      'submit .form-delivery-settings': 'save'
    },

    fieldMap: {
    },

    fieldGetters: {
    },

    initialize: function() {
    }

  });
});
