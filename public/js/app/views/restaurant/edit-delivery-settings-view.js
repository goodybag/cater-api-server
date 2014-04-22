define(function(require, exports, module) {
  var utils = require('utils');
  var EditRestaurantView = require('./edit-restaurant-view');
  var Handlebars = require('handlebars');

  return module.exports = EditRestaurantView.extend({

    events: {
      'submit .form-delivery-settings': 'save'
    , 'click .btn-add-delivery-tier': 'addDeliveryTierClick'
    },

    fieldMap: {

    },

    fieldGetters: {

    },

    addDeliveryTier: function() {
      var last = this.$el.find('.delivery-zip-group:last-child');
      var clone = last.clone();
      clone.find('input').val('');
      last.after(clone);
    },

    addDeliveryTierClick: function(e) {
      e.preventDefault();
      this.addDeliveryTier();
    },

    initialize: function() {
    },

  });
});
