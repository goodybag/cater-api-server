var db = require('../../db');
var definition = require('../../db/definitions/restaurant-events');
var errors = require('../../errors');
var utils = require('../../utils');
var models = require('../../models');
var restaurantIdParam = require('../../middleware/restaurant-id-param');

/**
 * GET /restaurants/:rid/events?date=
 */
module.exports.list = function(req, res, next) {
  utils.async.parallel({
    events: function getEvents(callback) {
      var query = {
        where: {}
      , joins: []
      };

      restaurantIdParam.applyValueToWhereClause( req.params.rid, query.where );
      query.joins.push( restaurantIdParam.getJoinFrom('restaurant_events') );

      models.RestaurantEvent.find(query, function( error, results) {
        callback(error, results);
      });
    },

    restaurant: function getRestaurant(callback) {
      var query = {
        where: {}
      };

      restaurantIdParam.applyValueToWhereClause( req.params.rid, query.where );

      models.Restaurant.findOne(query, function( error, restaurant ) {
        callback(error, restaurant.toJSON());
      });
    }
  },
  function(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('admin/restaurant/availability', {
      events: results.events
    , restaurant: results.restaurant
    });
  });
}

/**
 * POST /restaurants/:rid/events
 */
module.exports.create = function(req, res, next) {
  var data = utils.extend({}, req.body, {restaurant_id: req.params.rid});
  var restaurantEvent = new models.RestaurantEvent(data);
  restaurantEvent.save(function(error, restaurantEvent) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(restaurantEvent[0]);
  });
};

/**
 * PUT /restaurants/:rid/events/:eid
 */
module.exports.update = function(req, res, next) {
  models.RestaurantEvent.findOne({
    where: {
      restaurant_id: req.params.rid
    , id: req.params.eid
    }
  },
  function(err, event) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    var fields = utils.keys(definition.schema);
    utils.extend(event.attributes, utils.pick(req.body, fields));
    event.save(function(err, rows, result) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      res.send(event.toJSON());
    })
  });
};

/**
 * DELETE /restaurants/:rid/events/:eid
 */
module.exports.remove = function(req, res, next) {
  var query = {
    restaurant_id: req.params.rid
  , id: req.params.eid
  };
  new models.RestaurantEvent(query).destroy(function( error ){
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(204);
  });
};
