define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var Views = {
    EditBasicInfoView: require('app/views/restaurant/edit-billing-info-view')
  , AlertView: require('app/views/alert-view')
  };

  var page = {
    init: function( options ){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      options.models.restaurant.urlRoot = '/api/restaurants';

      var restaurantEditView = new Views.EditBasicInfoView({
        el : '.restaurant-edit'
      , model: options.models.restaurant
      , alertView: alertView
      });
    }
  };

  return page;
});