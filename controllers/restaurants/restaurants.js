var
  db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  var query = queries.restaurant.list(['restaurants.*']);

  var joins = {};

  if (req.session.orderParams && req.session.orderParams.zip) {
    joins.zips = {
      type: 'inner'
    , on: {'restaurants.id': '$zips.restaurant_id$'}
    , target: {
        type: 'select'
      , table: 'restaurant_delivery_zips'
      , columns: ['restaurant_id']
      , where: {zip: req.session.orderParams.zip}
      }
    }
  }
  if (req.session.orderParams && req.session.orderParams.guests) {
    // SELECT * FROM restaurants
    // INNER JOIN (SELECT restaurant_id FROM restaurant_lead_times
    // WHERE max_guests >= X GROUP BY restaurant_id) AS rlt ON restaurants.id=rlt.restaurant_id;
    joins.rlt = {
      type: 'inner'
    , on: {'restaurants.id': '$rlt.restaurant_id$'}
    , target: {
        type: 'select'
      , table: 'restaurant_lead_times'
      , columns: ['restaurant_id']
      , where: {max_guests: {$gte: req.session.orderParams.guests}}
      , groupBy: ['restaurant_id']
      }
    }
  }

  query.joins = utils.extend({}, query.joins, joins);

  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, results) {
    if (err) return res.error(errors.internal.UNKNOWN, err);
    res.render('restaurants', {restaurants: results}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      return res.send(html);
    });
  });
}

module.exports.get = function(req, res) {
  models.Restaurant.findOne(parseInt(req.params.rid), function(error, restaurant) {
    restaurant.getItems(function(error, items) {
      res.render('menu', {restaurant: restaurant.toJSON()}, function(error, html) {
        if (error) return res.error(errors.internal.UNKNOWN, error);
        return res.send(html);
      });
    });
  });
}

module.exports.create = function(req, res) {
  var query = queries.restaurant.create(req.body);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, err);
    res.send(201, rows[0]);
  });
}

module.exports.update = function(req, res) {
  var query = queries.restaurant.update(req.body, req.params.rid);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.send(200, rows[0]);
  });
}

module.exports.listItems = function(req, res) {
  (new models.Restaurant({id: req.params.rid})).getItems(function(error, items) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(utils.invoke(items, 'toJSON'));
  });
}
