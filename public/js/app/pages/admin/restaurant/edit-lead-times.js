define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');
  var utils = require('utils');

  var Views = {
    EditLeadTimesView: require('app/views/restaurant/edit-lead-times-view')
  , EditHoursView: require('app/views/edit-hours-view')
  , AlertView: require('app/views/alert-view')
  };

  var Models = {
    Hours: require('app/models/hours')
  };

  var page = {
    init: function( options ){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var deliveryHours = utils.map(options.models.restaurant.attributes.delivery_times, function(times, idx) {
        return new Views.EditHoursView({
          model: new Models.Hours({ day: idx, times: times })
        , el: '#delivery-hours-' + idx
        });
      });

      var hours = utils.map(options.models.restaurant.attributes.delivery_times, function(times, idx) {
        return new Views.EditHoursView({
          model: new Models.Hours({ day: idx, times: times })
        , el: '#delivery-hours-' + idx
        });
      });

      var deliveryLeadTimesView = new Views.EditLeadTimesView({
        el : '.restaurant-edit'
      , model: options.models.restaurant
      , alertView: alertView
      , hours: hours
      });
    }
  };

  return page;
});