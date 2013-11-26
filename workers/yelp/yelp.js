/**
 * Yelp API
 */

var config  = require('../../config');
var utils   = require('../../utils');
var yelp    = module.exports = {};

yelp.getOauthParameters = function(){
  return {
    oauth_consumer_key: config.yelp.consumerKey
  , oauth_token: config.yelp.token
  , oauth_signature_method: 'hmac-sha1'
  }
};

yelp.businesses = {};

yelp.businesses.get = function( id, callback ){
  var url = [ config.yelp.apiUrl, 'businesses', id ].join('/');

  utils.get( url, callback );
};