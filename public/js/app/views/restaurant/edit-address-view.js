define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({

    events: {
      'submit .form-address': 'save'
    },

    fieldMap: {
      street: '.restaurant-street'
    , city: '.restaurant-city'
    , state: '.restaurant-state'
    , zip: '.restaurant-zip'
    },

    fieldGetters: {
    },

    initialize: function() {
    }

  });
});
