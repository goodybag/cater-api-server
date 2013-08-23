var
  db = require('../../db')
, queries = require('../../db/queries')
, errors = require('../../errors')
, utils = require('../../utils')
, moment = require('moment-timezone');

;

var models = require('../../models');

module.exports.list = function(req, res) {
  //TODO: middleware to validate and sanitize query object

  var columns = ['restaurants.*'];
  var query = queries.restaurant.list(columns);

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

  var joinRlt = {
    type: 'inner'
  , on: {'restaurants.id': '$rlt.restaurant_id$'}
  , target: {
      type: 'select'
    , table: 'restaurant_lead_times'
    , distinct: true
    , columns: ['restaurant_id']
    , where: {}
    }
  }

  var joinRdt = {
    type: 'inner'
  , on: {'restaurants.id': '$rdt.restaurant_id$'}
  , target: {
      type: 'select'
    , table: 'restaurant_delivery_times'
    , columns: ['restaurant_id']
    , where: {}
    }
  }

  if (req.session.orderParams && req.session.orderParams.guests) {
    joinRlt.target.where.max_guests = {$gte: req.session.orderParams.guests};
    joins.rlt = joinRlt;
  }

  // only worry about time if date is set, otherwise don't worry about time
  if (req.session.orderParams && req.session.orderParams.date) {
    // get order date and time from session
    var datetime = req.session.orderParams.date;
    if(req.session.orderParams.time) datetime += ' ' + req.session.orderParams.time;

    // for now use tz America/Chicago, in future store this zoneinfo in the database
    // set the query paramaters
    var timezone = 'America/Chicago';
    var hours = Math.floor(moment.duration(new moment(datetime).tz(timezone) - new moment().tz(timezone)).as('hours'));

    joinRlt.target.where.hours = {$lte: hours};
    joins.rlt = joinRlt;

    joinRdt.target.where.day = moment(datetime).format('dddd');
    if(req.session.orderParams.time) {
      joinRdt.target.where.$custom = ["'" + moment(datetime).format('HH:mm') + "'::time between start_time::time and end_time::time"];
    }

    joins.rdt = joinRdt;
  }

  query.joins = utils.extend({}, query.joins, joins);

  var sql = db.builder.sql(query);
  db.query(sql, function(err, results) {
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
