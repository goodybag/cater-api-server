define(function(require){
  var utils     = require('utils');
  var config    = require('config');
  var resource  = require('resource')({
    http: utils.http
  });

  var api = resource( config.baseUrl + '/api' );

  api.users       = api('users');
  api.restaurants = api('restaurants');

  api.maps        = api('maps');

  api.maps.validateAddress = function( address, callback ){
    api.maps('address-validity').get( address, callback );
  };

  api.legacy      = resource( config.baseUrl );

  api.legacy.orders = api.legacy('orders');

  return api;
});