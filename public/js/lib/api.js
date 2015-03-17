define(function(require){
  var utils     = require('utils');
  var config    = require('config');
  var resource  = require('./resource');

  var api = resource( config.baseUrl + '/api' );

  api.users       = api('users');
  api.restaurants = api('restaurants');

  api.maps        = api('maps');
  api.maps.validateAddress = api.maps('address-validity');

  api.legacy      = resource( config.baseUrl );

  api.legacy.orders = api.legacy('orders');

  return api;
});