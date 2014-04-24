define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var Views = {
    EditAddressView: require('app/views/restaurant/edit-address-view')
  , AlertView: require('app/views/alert-view')
  };

  var data = require('data')
  var page = {
    init: function(){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var restaurantEditView = new Views.EditAddressView({
        el : '.restaurant-edit'
      , model: data.models.restaurant
      , alertView: alertView
      });
    },

  };

  return page;
});