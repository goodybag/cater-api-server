define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');
  var utils = require('utils');

  var Views = {
    EditDeliverySettingsView: require('app/views/restaurant/edit-delivery-settings-view')
  , EditHoursView: require('app/views/edit-hours-view')
  , AlertView: require('app/views/alert-view')
  };

  var Models = {
    Hours: require('app/models/hours')
  };

  var data = require('data');
  var page = {
    init: function(){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var restaurantEditView = new Views.EditDeliverySettingsView({
        el : '.restaurant-edit'
      , model: data.models.restaurant
      , alertView: alertView
      });

      var hours = utils.map(data.models.restaurant.attributes.delivery_times, function(times, idx) {
        return new Views.EditHoursView({
          model: new Models.Hours({ day: idx, times: times })
        , el: '#hours-' + idx
        });
      });
    },

  };

  return page;
});