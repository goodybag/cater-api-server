/**
 * Controllers.Api.Restaurants
 */

var db    = require('db');
var utils = require('../../utils');
var yelp  = require('yelp');

var stamps = {
  yelpBusiness:       require('../../public/js/app/stamps/yelp-business')
, restaurantGleaning: require('../../public/js/app/stamps/restaurant-gleaning')
};

module.exports.autoPopulate = function( req, res ){
  var restaurant = stamps.restaurantGleaning( req.restaurant );

  utils.async.waterfall([
    function( next ){
      yelp.business( restaurant.yelp_business_id, next );
    }

  , function( yelpBiz, next ){

    }
  ], function( error ){

  });
};

var yelpBiz = stampit.compose( yelp, yelpFetcher ).create({ id:  });

yelpBiz

yelpFetcher({ id }).fetch()