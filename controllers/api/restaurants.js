/**
 * Controllers.Api.Restaurants
 */

var db    = require('../../db');
var utils = require('../../utils');
var yelp  = require('yelp');

var stamps = {
  yelpBusiness:       require('../../public/js/app/stamps/yelp-business')
, restaurantGleaning: require('../../public/js/app/stamps/restaurant/gleaning')
};

module.exports.autoPopulate = function( req, res ){
  var logger = req.logger.create('Controller-Restaurant.AutoPopulate');

  var restaurant = stamps.restaurantGleaning( req.restaurant );

  utils.async.auto({
    'removeExistingRestaurantMealTypes':
    function( done ){
      logger.info('removeExistingRestaurantMealTypes');
      db.restaurant_meal_types.remove({ restaurant_id: restaurant.id }, function( error, results ){
        return done( error );
      });
    }

  , 'getYelpData':
    function( next ){
      logger.info('getYelpData');
      yelp.business( restaurant.yelp_business_id, next );
    }

  , 'insertNewMealTypes': [
      'removeExistingRestaurantMealTypes'
    , function( done ){
        logger.info('insertNewMealTypes');
        var types = restaurant.getMealTypesFromHours();

        types = types.map( function( type ){
          return { restaurant_id: restaurant.id, meal_type: type };
        });

        db.restaurant_meal_types.insert( types, done );
      }
    ]

  , 'updateRestaurant': [
      'getYelpData'
    , function( yelpBiz, done ){
        logger.info('updateRestaurant');
        yelpBiz = stamps.yelpBusiness( yelpBiz );

        var $update = {
          cuisines: yelpBiz.categoriesToGbCuisines()
        };

        db.restaurants.update( restaurant.id, $update, done );
      }
    ]
  }, function( error ){
    if ( error ){
      throw error;
    }

    res.send(204);
  });
};