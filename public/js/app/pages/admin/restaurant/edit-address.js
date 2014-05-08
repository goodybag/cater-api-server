define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var Views = {
    EditAddressView: require('app/views/restaurant/edit-address-view')
  , AlertView: require('app/views/alert-view')
  };

  var page = {
    init: function( options ){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var restaurantEditView = new Views.EditAddressView({
        el : '.restaurant-edit'
      , model: options.models.restaurant
      , alertView: alertView
      });
    }
  };

  return page;
});