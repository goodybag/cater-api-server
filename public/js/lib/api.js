define(function(require){
  var utils = require('utils');
  var config = require('config');
  var resource = require('./resource');

  return {
    users: resource( require('./api/users'), {
      payment_methods:
    })
  };
});