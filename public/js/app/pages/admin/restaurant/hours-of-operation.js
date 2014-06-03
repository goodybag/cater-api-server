define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');
  var utils = require('utils');

  var Views = {
    EditPickupLeadTimesView: require('app/views/restaurant/edit-pickup-lead-times-view')
  , EditHoursView: require('app/views/edit-hours-view')
  , AlertView: require('app/views/alert-view')
  };

  var Models = {
    Hours: require('app/models/hours')
  };

  var page = {
    init: function( options ){
      page.alertView = new Views.AlertView({
        el: '.alert-container'
      });

      page.hours = utils.map(options.models.restaurant.attributes.hours_of_operation, function(times, idx) {
        return new Views.EditHoursView({
          model: new Models.Hours({ day: idx, times: times })
        , el: '#hours-' + idx
        });
      });

      page.deliveryLeadTimesView = new Views.EditPickupLeadTimesView({
        el : '.restaurant-edit'
      , model: options.models.restaurant
      , alertView: page.alertView
      , hours: page.hours
      });
    }
  };

  return page;
});