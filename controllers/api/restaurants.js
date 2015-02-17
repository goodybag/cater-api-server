/**
 * Controllers.Api.Restaurants
 */

var stampit = require('stampit');
var db      = require('../../db');
var utils   = require('../../utils');
var yelp    = require('yelp');

var ybusinesses = stampit()
  .compose( require('stamps/yelp-business/fetch') )
  .compose( require('stamps/yelp-business/coercions') );

var restaurants = stampit()
  .compose( require('stamps/restaurant/gleaning') );

module.exports.autoPopulate = function( req, res ){
  var logger = req.logger.create('Controller-Restaurant.AutoPopulate');

  var restaurant = restaurants.create( req.restaurant );
  var yelpBiz    = ybusinesses.create({ id: restaurant.yelp_business_id });

  utils.async.auto({
    'removeExistingRestaurantMealTypes':
    function( next ){
      logger.info('removeExistingRestaurantMealTypes');
      db.restaurant_meal_types.remove({ restaurant_id: restaurant.id }, function( error, results ){
        return next( error );
      });
    }

  , 'getYelpData':
    function( next ){
      logger.info('getYelpData');
      yelpBiz.fetch( next );
    }

  , 'getCuisines':
    function( next ){
      db.cuisines.find( {}, { limit: 'all' }, function( error, cuisines ){
        if ( error ) return next( error );

        yelpBiz.allCuisines = utils.pluck( cuisines, 'name' );

        next();
      });
    }

  , 'insertNewMealTypes': [
      'removeExistingRestaurantMealTypes'
    , function( next ){
        logger.info('insertNewMealTypes');
        var types = restaurant.getMealTypesFromHours();

        types = types.map( function( type ){
          return { restaurant_id: restaurant.id, meal_type: type };
        });

        db.restaurant_meal_types.insert( types, next );
      }
    ]

  , 'updateRestaurant': [
      'getYelpData', 'getCuisines'
    , function( next ){
        logger.info('updateRestaurant');

        var $update = {
          cuisine: yelpBiz.categoriesToGbCuisines()
        };

        db.restaurants.update( restaurant.id, $update, next );
      }
    ]
  }, function( error ){
    if ( error ){
      logger.error('Error doing update magic', {
        error: error
      });

      return res.error( error );
    }

    res.sendStatus(204);
  });
};

module.exports.updateDeliverySettings = function(req, res) {
  var deliveryZips = req.body.delivery_zips;
  var restaurantId = req.params.id;
  if ( deliveryZips.length ) {
    var tx = db.tx.create();

    deliveryZips = deliveryZips.map(function(dz) {
      dz.restaurant_id = restaurantId;
      return dz;
    });
    utils.async.series([
      tx.begin.bind(tx)
    , tx.restaurant_delivery_zips.remove.bind(tx.restaurant_delivery_zips, { restaurant_id: restaurantId }, { returning: ['*'] })
    , tx.restaurant_delivery_zips.insert.bind(tx.restaurant_delivery_zips, deliveryZips)
    ], function(err) {
      if ( err ) {
        tx.rollback();
        return res.send(500, err);
      }

      return res.send(204);
    });

    // create transaction
    // delete all delivery zips per this restaurant
  }
  res.sendStatus(204);
};
