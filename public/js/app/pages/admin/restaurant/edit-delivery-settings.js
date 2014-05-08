define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');
  var utils = require('utils');

  var Views = {
    EditDeliverySettingsView: require('app/views/restaurant/edit-delivery-settings-view')
  , EditHoursView: require('app/views/edit-hours-view')
  , AlertView: require('app/views/alert-view')
  };

  var page = {
    init: function( options ){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var restaurantEditView = new Views.EditDeliverySettingsView({
        el : '.restaurant-edit'
      , model: options.models.restaurant
      , alertView: alertView
      });
    },
  };

  return page;
});