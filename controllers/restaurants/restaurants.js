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
  orderParams.complete = utils.reduce(['zip', 'guests', 'date', 'time'], function(memo, key) {
    return memo && this[key] != null;
  }, true, orderParams);

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

  if (orderParams && (orderParams.date || orderParams.time)) {

    var datetime = null;

    if (orderParams.time) {//ISO-8601 string
      datetime = moment(orderParams.time);
    }

    // determine if lead time is unacceptable only if date is provided
    if (orderParams.date) {
      // if date specified then update existing datetime object with date
      // or create a new datetime object and set the time to be 23:59:59
      // new datetime object is created only if an order time wasn't specified.
      var date = moment(orderParams.date);
      if(datetime == null) {
        datetime = date;
        datetime.hour(23);
        datetime.minute(59);
        datetime.second(59);
      } else {
        datetime.month(date.month());
        datetime.date(date.date());
        datetime.year(date.year());
      }


      // mongo-sql can't do the following in a nice way yet:
      // hours: {$lte: "$EXTRACT(EPOCH FROM ('"+datetime.toISOString()+"' - now())/3600)$"}
      // current work around in mongo-sql is this, but not going to do that:
      // hours: {$custom: ['"hours" < EXTRACT(EPOCH FROM ($1 - now())/3600)', datetime.toISOString()]}
      // instead going to calculating it in code
      var hours = Math.floor(moment.duration(new moment(datetime) - new moment()).as('hours'));

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
          , 'lead_time': {$lte: hours}
          }
        }
      }

      columns.push('(lead_times.restaurant_id IS NULL) AS lead_time_unacceptable');
    }

    var day = moment(datetime).tz('America/Chicago').day();
    var time = moment(datetime).utc().format('HH:mm');

    joins.delivery_times = {
      type: 'left'
    , alias: 'delivery_times'
    , target: 'restaurant_delivery_times'
    , on: {
        'restaurants.id': '$delivery_times.restaurant_id$'
      }
    }

    if (orderParams.date) {
      joins.delivery_times.on['delivery_times.day'] = day;
    }

    if (orderParams.time) {
      joins.delivery_times.on['delivery_times.start_time'] = {$lte: time};
      joins.delivery_times.on['delivery_times.end_time'] = {$gte: time};
    }

    columns.push('(delivery_times.id IS NULL) AS delivery_time_unacceptable');
  }

  query.joins = utils.extend({}, query.joins, joins);

  var sql = db.builder.sql(query);
  console.log(sql);
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
    res.render('restaurants', {restaurants: restaurants, orderParams: orderParams}, function(error, html) {
      if (error) return res.error(errors.internal.UNKNOWN, error);
      return res.send(html);
    });
  });
}

module.exports.get = function(req, res) {
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
      models.Restaurant.findOne(parseInt(req.params.rid), function(err, restaurant) {
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
