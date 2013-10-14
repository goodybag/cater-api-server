var
  moment = require('moment-timezone')
, db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
, states = require('../../public/states')
;

var models = require('../../models');

var logger = require('../../logger');

utils.findWhere(states, {abbr: 'TX'}).default = true;

module.exports.list = function(req, res) {
  var TAGS = ['restaurants-list'];
  logger.routes.info(TAGS, 'listing restaurants');
  //TODO: middleware to validate and sanitize query object
  var orderParams = req.session.orderParams || {};
  models.Restaurant.find({}, orderParams, function(err, restaurants) {
    if (err) return res.error(errors.internal.DB_FAILURE, err), logger.db.error(err);
    models.Address.findOne({where: {
      user_id: req.session.user.id
    , is_default: true
    }}, function(err, address) {
      if (err) return res.error(errors.internal.DB_FAILURE, err), logger.db.error(err);
      if (address) address = address.toJSON();

      res.render('restaurants', {
        restaurants: utils.invoke(restaurants, 'toJSON')
      , orderParams: orderParams
      , zip:         orderParams.zip || address.zip || ''
      });
    });
  });
}

module.exports.get = function(req, res) {
  var TAGS = ['restaurants-get'];
  logger.routes.info(TAGS, 'getting restaurant ' + req.params.rid);

  var orderParams = req.session.orderParams || {};

  var tasks = [
    function(callback) {
      if (!req.session.user) return callback(null, null);
      var where = {restaurant_id: req.params.rid, user_id: req.session.user.id, 'latest.status': 'pending'};
      models.Order.findOne({where: where}, function(err, order) {
        if (err) return callback(err);
        if (order == null) {
          order = new models.Order({ restaurant_id: req.params.rid,
                                     user_id: req.session.user.id,
                                     adjustment: {description: null, amount: null}});
          order.getRestaurant(function(error){
            callback(error, order);
          });
          return;
        }
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

    var orderParams = req.session.orderParams || {};

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
    var context = {restaurants: utils.invoke(models, 'toJSON'), states: states, isNew: true};
    context.restaurant = {delivery_times: utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; }))};  // tmp hack
    res.render('edit-restaurants', context, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      return res.send(html);
    });
  });
};

var zips = function(body, id) {
  return utils.map(body.delivery_zips, function(zip, index, arr) {
    return {restaurant_id: id,  zip: zip}
  });
}

var deliveryTimes = function(body, id) {
  return Array.prototype.concat.apply([], utils.map(body.delivery_times, function(times, day, obj) {
    return utils.map(times, function(period, index, arr) {
      return {
        restaurant_id: id,
        day: day,
        start_time: period[0],
        end_time: period[1]
      };
    });
  }));
}

var leadTimes = function(body, id) {
  return utils.map(body.lead_times, function(obj, index, arr) {
    return utils.extend({restaurant_id: id}, obj);
  });
}

// maybe this ought to come from the restaurant model?
var fields = ['name', 'is_hidden', 'street', 'city', 'state', 'zip', 'sms_phone', 'voice_phone', 'email', 'minimum_order', 'price', 'delivery_fee', 'cuisine'];

module.exports.create = function(req, res) {
  var restaurantQuery = queries.restaurant.create(utils.pick(req.body, fields));
  var sql = db.builder.sql(restaurantQuery);
  db.query(sql.query, sql.values, function(err, rows, result) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);

    var insert = function(values, method, callback) {
      if (!values || values.length === 0) return callback();
      var query = queries.restaurant[method](values);
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, callback);
    }

    var tasks = utils.map(
      [[zips, 'createZips'], [deliveryTimes, 'createDeliveryTimes'], [leadTimes, 'createLeadTimes']],
      function(args) { return utils.partial( insert, args[0](req.body, rows[0].id), args[1]); }
    );

    var done = function(err, results) {
      if (err) return res.error(errors.internal.UNKNOWN, err);
      res.send(201, rows[0]);
    };

    utils.async.parallel(tasks, done);
  });
}

module.exports.update = function(req, res) {
  // this should be an array of three functions, each an async eachSeries to destroy and recreate
  // the subrecords associated with this restaurant.
  // it's a series, so the delete query should always complete before the assocated insert query on the same table.
  // but each table is independent.
  var tasks = utils.map([['Zips', zips, 'delivery_zips'], ['DeliveryTimes', deliveryTimes, 'delivery_times'], ['LeadTimes', leadTimes, 'lead_times']], function(args) {
    if (req.body[args[2]] === undefined) return function(cb) { cb() };
    var delQuery = queries.restaurant['del' + args[0]](req.params.rid)
    var values = args[1](req.body, req.params.rid);
    var createQuery = values.length > 0 ? queries.restaurant['create' + args[0]](values) : null;

    return utils.partial(utils.async.eachSeries, [delQuery, createQuery], function(query, cb) {
      if (!query) return cb();
      var sql = db.builder.sql(query);
      db.query(sql.query, sql.values, cb);
    });
  });

  // add the acutal restaurant table update as the fourth parallel function.
  tasks.push(function(cb) {
    var updates = utils.pick(req.body, fields);
    if (utils.size(updates) === 0) return cb();
    var query = queries.restaurant.update(updates, req.params.rid);
    var sql = db.builder.sql(query);
    db.query(sql.query, sql.values, cb);
  });

  utils.async.parallel(tasks, function(err, results) {
    if (err) return res.error(errors.internal.DB_FAILURE, err);
    res.send(200, (results[3]||0)[0]); // TODO: better than results[3]
  });
}

module.exports.remove = function(req, res) {
  new models.Restaurant({ id: req.params.rid }).destroy(function( error ){
    if (error) return res.error(errors.internal.DB_FAILURE, error);

    res.send(204);
  });
}

module.exports.listItems = function(req, res) {
  (new models.Restaurant({id: req.params.rid})).getItems(function(error, items) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(utils.invoke(items, 'toJSON'));
  });
}
