define(function(require){
  var $ = require('jquery');
  var api = require('api');
  require('jquery-loaded');

  var Views = {
    EditBasicInfoView: require('app/views/restaurant/edit-basic-info-view')
  , AlertView: require('app/views/alert-view')
  };

  var page = {
    init: function( options ){
      page.options = options;

      options.models.restaurant.urlRoot = '/api/restaurants';

      var alertView = new Views.AlertView({
        el: '.alert-container'
      });

      var restaurantEditView = new Views.EditBasicInfoView({
        el : '.restaurant-edit'
      , model: options.models.restaurant
      , alertView: alertView
      });

      $('#auto-magic').click( function( e ){
        var restaurant = api.restaurants( options.models.restaurant.get('id') );
        restaurant('auto-update').post( function( error ){
          if ( error ){
            console.log(error);
            return alertView.show({
              type: 'error'
            , message: 'Blargle! Something went wrong. Go get John'
            });
          }

          alertView.show({
            type: 'success'
          , message: 'Auto magic complete!'
          });
        });
      });
    }
  };

  return page;
});