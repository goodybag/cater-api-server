define(function(require){
  var $ = require('jquery');
  require('jquery-loaded');
  var utils = require('utils');

  var Views = {
    EditPhotosView: require('app/views/restaurant/edit-photos-view')
  , AlertView: require('app/views/alert-view')
  };

  var page = {
    init: function( options ){

      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var editPhotosView = new Views.EditPhotosView({
        el: '.edit-photos'
      , collection: options.models.photos
      , defaultLogo: options.defaultLogo
      });
    },

  };

  return page;
});
