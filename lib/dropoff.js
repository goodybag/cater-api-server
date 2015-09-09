var dropoff = module.exports = require('com.dropoff.service.brawndo.client');
var config  = require('../config');

dropoff.configure({
  public_key:   config.credentials['dropoff.com'].publicKey
, private_key:  config.credentials['dropoff.com'].privateKey
, api_url:      config.dropoff.apiUrl
, host:         config.dropoff.host
});