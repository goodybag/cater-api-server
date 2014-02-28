define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var Views = {
    EditBasicInfoView: require('app/views/restaurant/edit-basic-info-view')
  };

  var data = require('data')
  var page = {
    init: function(){
      var editBasicInfoView = new Views.EditBasicInfoView({
        el : '.restaurant-edit' 
      , model: data.models.restaurant
      });
    },

  };

  return page;
});