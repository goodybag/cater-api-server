/**
 * Controllers.Api.Restaurants
 */

var stampit = require('stampit');
var db      = require('../../db');
var utils   = require('../../utils');
var errors  = require('../../errors');
var yelp    = require('yelp');
var m       = require('../../middleware');

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

module.exports.getBankAccount = [
  m.getRestaurant({
    param:  'id'
  , stripe: true
  })

, function( req, res ){
    var accounts = req.restaurant.stripe_account.bank_accounts.data;

    if ( accounts.length === 0 ){
      req.logger.warn('No bank account information found');

      return next( errors.internal.NOT_FOUND );
    }

    res.json( accounts );
  }
];

module.exports.updateBankAccount = [
  m.getRestaurant({
    param:  'id'
  , stripe: true
  })

  //
  // TODO:
  // Abstract this out into models
  //
, function( req, res ){
    var stripeId = req.restaurant.stripe_id;
    var accounts = req.restaurant.stripe_account.bank_accounts.data;

    var newAccount = utils.extend({
      object:   'bank_account'
    , country:  'US'
    , currency: 'usd'
    }, utils.pick( req.body, [
      'account_number', 'routing_number'
    ]));

    if ( !newAccount.account_number ){
      return res.error( errors.input.VALIDATION_FAILED, {
        message: 'Missing required field `account_number`'
      });
    }

    if ( !newAccount.routing_number ){
      return res.error( errors.input.VALIDATION_FAILED, {
        message: 'Missing required field `routing_number`'
      });
    }

    utils.async.series([
      // Create the new Default account
      function( next ){
        utils.stripe.accounts.createExternalAccount( stripeId, {
          external_account: newAccount
        , default_for_currency: true
        , metadata: req.body.metadata
        }, next );
      }

      // Delete the existing accounts
    , function deleteAccounts( next ){
        if ( accounts.length === 0 ) return next();

        var account = accounts.pop();

        utils.stripe.accounts.deleteExternalAccount(
          stripeId
        , account.id
        , function( error ){
            if ( error ){
              return next( error );
            }

            return deleteAccounts( next );
          }
        );
      }
    ], function( error ){
      if ( error ){
        return res.error( error );
      }

      res.send(204);
    });
  }
];