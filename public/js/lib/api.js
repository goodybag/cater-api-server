define(function(require){
  var utils = require('utils');
  var config = require('config');
  var resource = require('./resource');
console.log('setting api at', config.baseUrl);
  var api = resource( config.baseUrl + '/api' );

  api.users       = api('users');
  api.restaurants = api('restaurants');

  return api;
});