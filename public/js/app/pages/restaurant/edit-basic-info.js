define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var Views = {
    EditBasicInfoView: require('app/views/restaurant/edit-basic-info-view')
  , AlertView: require('app/views/alert-view')
  };

  var data = require('data')
  var page = {
    init: function(){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      

      var restaurantEditView = new Views.EditBasicInfoView({
        el : '.restaurant-edit'
      , model: data.models.restaurant
      , alertView: alertView
      });
    },

  };

  return page;
});