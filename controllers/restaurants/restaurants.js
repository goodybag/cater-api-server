var
  moment = require('moment-timezone')
, db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object

  var orderParams = req.session.orderParams || {};

  models.Restaurant.find({}, orderParams, function(err, models) {
    var restaurants = utils.invoke(models, 'toJSON');
    if (err) return res.error(errors.internal.UNKNOWN, err);
    // determine which businesses to disable in the listing
    // because they don't meet the order parameters
    var enabled = [];
    var disabled = [];

    for(var i=0; i< restaurants.length; i++){
      var restaurant = restaurants[i];

      if(restaurant.zip_unacceptable
        || restaurant.guests_unacceptable
        || restaurant.lead_time_unacceptable
        || restaurant.delivery_time_unacceptable
      ) {
        restaurant.disabled = true;
        disabled.push(restaurant);
      } else {
        restaurant.disabled = false;
        enabled.push(restaurant);
      }
    }

    var restaurants = enabled.concat(disabled);
    res.render('restaurants', {restaurants: restaurants, orderParams: orderParams}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      return res.send(html);
    });
  });
}

module.exports.get = function(req, res) {
  var orderParams = req.session.orderParams || {};

  var tasks = [
    function(callback) {
      if (!req.session.user) return callback(null, null);
      var where = {restaurant_id: req.params.rid, user_id: req.session.user.id, 'latest.status': 'pending'};
      models.Order.findOne({where: where}, function(err, order) {
        if (err) return callback(err);
        if (order == null) return callback(err, order);
        order.getOrderItems(function(err, items) {
          callback(err, order);
        });
      });
    },

    function(callback) {
      models.Restaurant.findOne(parseInt(req.params.rid), orderParams, function(err, restaurant) {
        if (err) return callback(err);
        restaurant.getItems(function(err, items) {
          callback(err, restaurant);
        });
      });
    }
  ];

  var done = function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    var orderParams = utils.clone(req.session.orderParams) || {};
    orderParams.complete = utils.reduce(['zip', 'guests', 'date', 'time'], function(memo, key) {
      return memo && this[key] != null;
    }, true, orderParams);

    var context = {
      restaurant: results[1].toJSON(),
      order: results[0] ? results[0].toJSON() : null,
      orderParams: orderParams
    }

    res.render('menu', context, function(err, html) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      return res.send(html);
    });
  };

  utils.async.parallel(tasks, done);
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
