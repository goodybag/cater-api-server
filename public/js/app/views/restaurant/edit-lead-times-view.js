define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({

    events: {
      'submit .form-delivery-settings': 'save'
    },

    fieldMap: {
      delivery_times: '.restaurant-form .time'
    },

    fieldGetters: {
      delivery_times: function() {
        var models = _.pluck(this.options.hours, 'model')
        return _.object(_.invoke(models, 'get', 'day'), _.invoke(models, 'toJSON'));
      }
    },

    initialize: function() {
    }

  });
});
