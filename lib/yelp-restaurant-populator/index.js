/**
 * Yelp Restaurant Populator
 */

var yelp    = require('yelp');
var config  = require('../../config');
var utils   = require('../../utils');
var error   = require('../../errors');
var db      = require('../../db');

yelp = yelp.createClient(
  utils.pick( config.yelp, [
    'consumerKey'
  , 'consumerSecret'
  , 'token'
  , 'tokenSecret'
  ])
);

module.exports.getYelpData = function( rid, callback ){
  utils.async.waterfall([
    db.restaurants.findOne.bind( db.restaurants, rid )

  , function( restaurant, next ){
      if ( !restaurant ){
        return next( errors.internal.NOT_FOUND );
      }

      if ( !restaurant.yelp_business_id ){
        return next( errors.restaurants.INVALID_YELP_BUSINESS_ID );
      }

      yelp.business( restaurant.yelp_business_id, callback );
    }
  ], callback );
};

module.exports.populate = function( rid, callback ){
  throw new Error('TODO');
};