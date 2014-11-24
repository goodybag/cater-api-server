define(function(require){
  var utils = require('utils');
  var config = require('config');
  var resource = require('./resource');

  var api = resource( config.baseUrl + '/api' );

  api.users = api('users');

  return api;
});