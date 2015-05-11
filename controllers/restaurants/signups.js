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

    if (results.status === 'completed') {
      req.body = results.data;
      restaurantsController._create(req, function (error, rows, results) {
        if (error) {
          console.log(error);
          return res.error(errors.internal.DB_FAILURE, error);
        }
        // TODO:
        // 1. notify user
        // 2. notify goodybag
        return res.status(200).json( results );
      });
    } else {
      return res.status(200).json( results );
    }

  });
};
