define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');

  var Views = {
    EditTagsView: require('app/views/restaurant/edit-tags-view')
  , AlertView: require('app/views/alert-view')
  };

  var page = {
    init: function( options ){
      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var restaurantEditView = new Views.EditTagsView({
        el : '.restaurant-edit'
      , model: options.models.restaurant
      , alertView: alertView
      });
    },

  };

  return page;
});