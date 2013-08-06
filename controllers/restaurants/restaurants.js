var
  db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object
  models.Restaurant.find(req.query, function(error, models) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('restaurants', {restaurants: utils.invoke(models, 'toJSON')}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      res.render('index', {content: html}, function(error, html) {
        if (error) return res.error(errors.internal.UNKNOWN, error);
        res.send(html);
      });
    });
  });
}

module.exports.get = function(req, res) {
  models.Restaurant.findOne(parseInt(req.params.rid), function(error, restaurant) {
    restaurant.getItems(function(error, items) {
      res.render('menu', {restaurant: restaurant.toJSON()}, function(error, html) {
        res.render('index', {content: html}, function(error, html) {
          if (error) return res.error(errors.internal.UNKNOWN, error);
          res.send(html);
        });
      });
    });
  });
}

module.exports.create = function(req, res) {
  var query = queries.restaurant.create(req.body);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.UNKNOWN, error);
    res.send(201, rows[0]);
  });
}

module.exports.listItems = function(req, res) {
  (new models.Restaurant({id: req.params.rid})).getItems(function(error, items) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.send(utils.invoke(items, 'toJSON'));
  });
}
