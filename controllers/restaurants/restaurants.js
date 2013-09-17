var
  moment = require('moment-timezone')
, db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
, states = require('../../public/states')
;

var models = require('../../models');

utils.findWhere(states, {abbr: 'TX'}).default = true;

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object

  var orderParams = req.session.orderParams || {};


  models.Restaurant.find({}, orderParams, function(err, models) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.render('restaurants', {restaurants: utils.invoke(models, 'toJSON'), orderParams: orderParams}, function(error, html) {
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
        if (!restaurant) return res.status(404).render('404');
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

module.exports.edit = function(req, res) {
  models.Restaurant.findOne(parseInt(req.params.rid), function(err, restaurant) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    restaurant.getItems(function(err, items) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      var selectedPrice = utils.object(utils.map([1, 2, 3, 4], function(i) {
        return [new Array(i+1).join('$'), restaurant.attributes.price === i];
      }));
      utils.findWhere(states, {abbr: restaurant.attributes.state || 'TX'}).default = true;
      res.render('edit-restaurant', {restaurant: restaurant.toJSON(), selectedPrice: selectedPrice, states: states}, function(err, html) {
        if (err) return res.error(errors.internal.UNKNOWN, err);
        res.send(html);
      });
    });
  });
}

module.exports.editAll = function(req, res, next) {
  models.Restaurant.find({}, function(err, models) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.render('edit-restaurants', {restaurants: utils.invoke(models, 'toJSON'), states: states, isNew: true}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      return res.send(html);
    });
  });
};

module.exports.create = function(req, res) {
  var fields = ['name', 'street', 'city', 'state', 'zip', 'sms_phone', 'voice_phone', 'email', 'minimum_order', 'price', 'delivery_fee', 'cuisine'];
  var restaurantQuery = queries.restaurant.create(utils.pick(req.body, fields));
  var sql = db.builder.sql(restaurantQuery);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    var id = rows[0].id;

    var zips = utils.map(req.body.delivery_zips, function(zip, index, arr) {
      return {restaurant_id: id,  zip: zip}
    });

    var deliveryTimes = Array.prototype.concat.apply([], utils.map(req.body.delivery_times, function(times, day, obj) {
      return utils.map(times, function(period, index, arr) {
        return {
          restaurant_id: id,
          day: day,
          start_time: period[0],
          end_time: period[1]
        };
      });
    }));

    var leadTimes = utils.map(req.body.lead_times, function(obj, index, arr) {
      return utils.extend({restaurant_id: id}, obj);
    });

    var insert = function(values, method, callback) {
      if (!values || values.length === 0) return callback();
      var query = queries.restaurant[method](values);
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, callback);
    }

    var tasks = utils.map([[zips, 'createZips'], [deliveryTimes, 'createDeliveryTimes'], [leadTimes, 'createLeadTimes']],
                          function(args) { return utils.partial.apply(utils, [insert].concat(args)); });

    var done = function(err, results) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      res.send(201, rows[0]);
    };

    utils.async.parallel(tasks, done);
  });

}

module.exports.update = function(req, res) {
  var query = queries.restaurant.update(req.body, req.params.rid);
  var sql = db.builder.sql(query);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(200, rows[0]);
  });
}

module.exports.remove = function(req, res) {
  res.send(501);
}

module.exports.listItems = function(req, res) {
  (new models.Restaurant({id: req.params.rid})).getItems(function(error, items) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(utils.invoke(items, 'toJSON'));
  });
}
