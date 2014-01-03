var db = require('../../db');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');

/**
 * GET /restaurants/:rid/events?date=
 */
module.exports.list = function(req, res, next) {
  var query = {
    where: { 
      restaurant_id: req.params.rid 
    }
  };

  models.RestaurantEvent.find(query, function( error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('restaurant/availability', {events: results});
  });
}

/**
 * POST /restaurants/:rid/events
 */
module.exports.create = function(req, res, next) {
  var query = utils.extend({}, req.body, {restaurant_id: req.params.rid});
  console.log(query);

  var restaurantEvent = new models.RestaurantEvent(query);

  restaurantEvent.save(function(error, restaurantEvent) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(restaurantEvent);
  });
};

/**
 * PUT /restaurants/:rid/events/:eid
 */
module.exports.update = function(req, res, next) {
  // TODO - implement
  res.send(400);
};

/**
 * DELETE /restaurants/:rid/events/:eid
 */
module.exports.remove = function(req, res, next) {
  // TODO - implement
  res.send(400);
};
