var
  db = require('../../db')
, utils = utils = require('../../utils')
, errors = require('../../errors')
, restaurantsController = require('./restaurants')
;

var restaurantDefinitionSchema = require('../../db/definitions/restaurants').schema;

module.exports.create = function (req, res) {
  var logger = req.logger.create('Controller-RestaurantsSignup-Create');

  db.restaurant_signups.insert(req.body, req.queryOptions, function (error, results) {
    if (error) {
      return res.error(errors.internal.DB_FAILURE, error);
    }

    results = results.length > 0 ? results[0] : results;

    //set user session with a restaurant signup id
    req.session.restaurant_signup_id = results.id;

    return res.json(results);
  });
};

module.exports.update = function (req, res) {
  var logger = req.logger.create('Controller-RestaurantsSignup-Update');

  db.restaurant_signups.update(req.queryObj, req.body, req.queryOptions, function (error, results) {
    if (error) {
      return res.error(errors.internal.DB_FAILURE, error);
    }

    results = results.length > 0 ? results[0] : results;

    if (results.status !== 'completed') return res.status(200).json(results);

    req.body = results.data;

    var tasks = [
      function calculateRegionID(next) {
        var nullRegion = 2;
        if (!req.body.zip) {
          req.body.region_id = nullRegion;
          return next(null);
        }
        db.region_zips.findOne({ zip: req.body.zip }, function (error, result) {
          req.body.region_id = result ? result.region_id || nullRegion : nullRegion;
          return next(null);
        });
      }
    , function createRestaurant (next) {
        return restaurantsController._create(req, next);
      }
    , function createContacts (rows, results, next) {
        var contacts = req.body.contacts.map(function (contact) {
          contact.restaurant_id = rows[0].id;
          return contact;
        });

        return db.contacts.insert(contacts, next);
      }
    ];

    utils.async.waterfall(tasks, function (error) {
      if (error) {
        console.log(error);
        return res.error(errors.internal.DB_FAILURE, error);
      }

      // TODO:
      // 1. notify user
      // 2. notify goodybag
      return res.status(200).json( results );
    });

  });
};
