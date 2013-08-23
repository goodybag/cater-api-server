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

  var orderParams = req.session.orderParams;

  var columns = ['restaurants.*'];
  var query = queries.restaurant.list(columns);

  var joins = {};

  if (orderParams && orderParams.zip) {
    joins.zips = {
      type: 'left'
    , alias: 'zips'
    , target: 'restaurant_delivery_zips'
    , on: {
        'restaurants.id': '$zips.restaurant_id$'
      , 'zips.zip': orderParams.zip
      }
    }

    columns.push('(zips.zip IS NULL) AS zip_unacceptable');
  }

  if (orderParams && orderParams.guests) {
    joins.guests = {
      type: 'left'
    , alias: 'guests'
    , target: 'restaurant_lead_times'
    , on: {'restaurants.id': '$guests.restaurant_id$'}
    , target: {
        type: 'select'
      , table: 'restaurant_lead_times'
      , distinct: true
      , columns: ['restaurant_id']
      , where: {
          'max_guests': {$gte: orderParams.guests}
        }
      }
    }

    columns.push('(guests.restaurant_id IS NULL) AS guests_unacceptable');
  }

  if (orderParams && orderParams.date) {
    var datetime = orderParams.date;
    if(orderParams.time) datetime += ' ' + orderParams.time;

    var timezone = 'America/Chicago';
    var hours = Math.floor(moment.duration(new moment(datetime).tz(timezone) - new moment().tz(timezone)).as('hours'));

    joins.lead_times = {
      type: 'left'
    , alias: 'lead_times'
    , target: 'restaurant_lead_times'
    , on: {'restaurants.id': '$lead_times.restaurant_id$'}
    , target: {
        type: 'select'
      , table: 'restaurant_lead_times'
      , distinct: true
      , columns: ['restaurant_id']
      , where: {
          'max_guests': {$gte: ((orderParams.guests) ? orderParams.guests : 0)}
        , 'hours': {$lte: hours}
        }
      }
    }

    columns.push('(lead_times.restaurant_id IS NULL) AS lead_time_unacceptable');

    var day = moment(datetime).tz(timezone).format('dddd');
    var time = moment(datetime).tz(timezone).format('HH:mm');

    joins.delivery_times = {
      type: 'left'
    , alias: 'delivery_times'
    , target: 'restaurant_delivery_times'
    , on: {
        'restaurants.id': '$delivery_times.restaurant_id$'
      , 'delivery_times.day': day
      }
    }

    if (orderParams.time) {
      joins.delivery_times.on['delivery_times.start_time'] = {$lte: time};
      joins.delivery_times.on['delivery_times.end_time'] = {$gte: time};
    }

    columns.push('(delivery_times.id IS NULL) AS delivery_time_unacceptable');
  }

  query.joins = utils.extend({}, query.joins, joins);

  var sql = db.builder.sql(query);
  db.query(sql, function(err, results) {
    if (err) return res.error(errors.internal.UNKNOWN, err);

    // determine which businesses to disable in the listing
    // because they don't meet the order parameters
    var enabled = [];
    var disabled = [];

    for(var i=0; i< results.length; i++){
      var row = results[i];
      if(row.zip_unacceptable || row.guests_unacceptable || row.lead_time_unacceptable || row.delivery_time_unacceptable) {
        row.disabled = true;
        disabled.push(row);
      } else {
        row.disabled = false;
        enabled.push(row);
      }
    }

    var restaurants = enabled.concat(disabled);
    res.render('restaurants', {restaurants: restaurants}, function(error, html) {
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
