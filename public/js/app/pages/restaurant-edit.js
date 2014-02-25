define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var Views = {
    RestaurantEditView: require('app/views/restaurant/edit-view')
  };

  var page = {
    init: function(){
      var restaurantEditView = new Views.RestaurantEditView({ el : '.restaurant-edit' });
    },

  };

  return page;
});