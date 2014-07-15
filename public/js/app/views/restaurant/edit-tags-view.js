define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({

    events: {
      'submit .form-basic-info': 'save'
    },

    fieldMap: {
      price: '.restaurant-price'
    , cuisine: '.restaurant-cuisine'
    , tags: '.restaurant-tags input'
    , meal_types: '.restaurant-meal-types input'
    , meal_styles: '.restaurant-meal-styles input'
    },

    fieldGetters: _.extend({
      price: _.partial(EditRestaurantView.intGetter, 'price'),

      cuisine: function() {
        return EditRestaurantView.fieldSplit.call(this, this.fieldMap.cuisine);
      },

      tags: function() {
        return _.pluck(this.$el.find(this.fieldMap.tags+ ':checked'), 'value');
      },

      meal_types: function() {
        return _.pluck(this.$el.find(this.fieldMap.meal_types + ':checked'), 'value');
      },

      meal_styles: function() {
        return _.pluck(this.$el.find(this.fieldMap.meal_styles + ':checked'), 'value');
      }
    }, EditRestaurantView.prototype.fieldGetters ),


    initialize: function() {
    }

  });
});
