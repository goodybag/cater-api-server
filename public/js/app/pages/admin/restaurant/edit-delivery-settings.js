define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');
  var utils = require('utils');

  var Views = {
    EditDeliverySettingsView: require('app/views/restaurant/edit-delivery-settings-view')
  , EditLeadTimesView: require('app/views/restaurant/edit-lead-times-view')
  , EditHoursView: require('app/views/edit-hours-view')
  , AlertView: require('app/views/alert-view')
  };

  var Models = {
    Hours: require('app/models/hours')
  };

  var page = {
    init: function( options ){
      page.options = options;

      page.alertView = new Views.AlertView({
        el: '.alert-container'
      });

      page.hours = utils.map(options.models.restaurant.attributes.delivery_times, function(times, idx) {
        return new Views.EditHoursView({
          model: new Models.Hours({ day: idx, times: times })
        , el: '#delivery-hours-' + idx
        });
      });

      page.deliverySettingsView = new Views.EditDeliverySettingsView({
        el : '#delivery-settings-form'
      , model: options.models.restaurant
      , alertView: page.alertView
      });

      page.deliveryLeadTimesView = new Views.EditLeadTimesView({
        el : '#delivery-times-form'
      , model: options.models.restaurant
      , alertView: page.alertView
      , hours: page.hours
      });
    }
  };

  return page;
});