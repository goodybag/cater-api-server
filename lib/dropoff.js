var dropoff = module.exports = require('@goodybag/dropoff-client');
var config  = require('../config');

dropoff.configure({
  public_key:   config.credentials['dropoff.com'].publicKey
, private_key:  config.credentials['dropoff.com'].privateKey
, api_url:      config.dropoff.apiUrl
, host:         config.dropoff.host
});
