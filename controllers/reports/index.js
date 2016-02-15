/**
 * Generate various reports in CSV
 */

var
  utils = require('../../utils')
, models = require('../../models')
, db = require('../../db')
, moment = require('moment-timezone')
, fs = require('fs')
, hbHelpers = require('../../public/js/lib/hb-helpers')
, errors = require('../../errors')
, config = require('../../config')
, restaurantPlans = require('restaurant-plans')
, Orders = require('stamps/orders')
, through = require('through2')
;


var dollars = hbHelpers.dollars;
var quoteVal = function(val) {
  return val ? '"'+val+'"' : '';
};
var parseDatetime = function(opts) {
  opts = opts || {};
  opts.fmt = opts.fmt || 'YYYY-MM-DD HH:mm';
  var datetime = opts.time ? opts.date + ' ' + opts.time : opts.date;
  datetime = moment(datetime);

  // orders.datetime is timestamp without timezone
  // orders.accepted and orders.submi
  if (opts.utc) datetime = datetime.utc();

  return datetime.format(opts.fmt);
};

var getAddress = function(obj) {
  if (!obj) return 'N/A';
  return [obj.street, obj.street2, obj.city, ', ' + obj.state, obj.zip].join(' ');
};

var orderCharge = function(order, fnName) {
  var restaurant = order.restaurant;
  var plan = restaurant.plan;

  if (!plan) return 'N/A';

  return require('stamps/orders/charge')( order )[fnName]();
}

var reports = {

  dateFormat: 'MM-DD-YYYY',
  timeFormat: 'hh:mm a',

  /**
   * Create a report page
   */
  index: function(req, res) {
    res.render('reports/create');
  },

  /**
   * POST /reports/orders
   */
  ordersCsv: function(req, res) {
    var rlogger = req.logger.create('CSV Reports');

    rlogger.info('Generate report', {
      query: req.query
    });

    var status = req.query.status;

    var start = parseDatetime({
      date: req.query.startDate || '2012-01-01'
    , time: req.query.startTime
    , utc: req.query.range !== 'datetime'
    });

    var end = parseDatetime({
      date: req.query.endDate || new Date()
    , time: req.query.endTime
    , utc: req.query.range !== 'datetime'
    });

    var sort = req.query.sort || 'asc';
    var restaurantId = req.query.restaurantId;
    var userId = req.query.userId;
    var regionId = parseInt(req.query.region);
    var paymentStatus = req.query.payment_status;
    var paymentMethod = req.query.payment_method;

    var filename = [
      status
    , 'orders'
    , start
    , end
    ].join('-') + '.csv';

    res.csv.writeFilename(filename);

    res.csv.writeRow([
      'Order Number'
    , 'Order Type'
    , 'Date Submitted'
    , 'Time Submitted'
    , 'Date Accepted'
    , 'Time Accepted'
    , 'Delivery Date'
    , 'Delivery Time'
    , 'Delivery Address'
    , 'Pickup Address'
    , 'Origin Zip'
    , 'Destination Zip'
    , 'User Name'
    , 'User Email'
    , 'Company Name'
    , 'User Phone'
    , 'Subtotal'
    , 'Delivery Fee'
    , 'Tax'
    , 'Tip'
    , 'Adjustment'
    , 'Total'
    , 'Plan'
    , 'GB Fee'
    , 'Restaurant Net Payout'
    , 'Caterer Name'
    , 'Region'
    ]);

    var where = { status: status || {}, restaurant_id: { $notNull: true } };
    var options = { limit: 'all' };

    if ( restaurantId ) where.restaurant_id = restaurantId;
    if ( userId ) where.user_id = userId;
    // by order datetime or submitted
    var range;
    switch ( req.query.range ) {
      case 'submitted':
        range = 'submitted_dates.submitted';
        break;
      case 'accepted':
        range = 'accepted_dates.accepted';
        break;
      case 'datetime':
      default:
        range = 'orders.datetime'
        break;
    }

    where[range] = {
      $gte: start
    , $lt: end
    };

    if ( regionId ) {
      where['restaurants.region_id'] = regionId;
    }

    if ( paymentStatus ) {
      where['payment_status'] = paymentStatus;
    }

    if ( paymentMethod ) {
      where['payment_method_id'] = { $null: paymentMethod === "invoiced" }
    }

    options.with = [
      { name: 'cached_order_items'
      , type: 'select'
      , table: 'order_items'
      , columns: ['order_items.*']
      , joins: [
          { type: 'left', target: 'orders', on: { 'id': '$order_items.order_id$' } }
        ]
      }
    , { name: 'cached_order_amenities'
      , type: 'select'
      , table: 'order_amenities'
      , columns: ['order_amenities.*']
      , joins: [
          { type: 'left', target: 'orders', on: { 'id': '$order_amenities.order_id$' } }
        ]
      }
    ];

    var cachedWhere = options.with[0].where = options.with[1].where = {};
    cachedWhere[ range ] = where[ range ];

    options.order = {};
    options.order[range] = sort;
    options.distinct = [ 'orders.id', range ];
    options.one = [
      { table: 'users', alias: 'user' }
    , { table: 'restaurants'
      , alias: 'restaurant'
      , one: [
          { table: 'restaurant_plans', alias: 'plan' }
        , { table: 'regions', alias: 'region' }
        ]
      }
    , { table: 'restaurant_locations', alias: 'location' }
    ];

    options.many = [
      { table: 'cached_order_items', alias: 'items'
      , where: { 'cached_order_items.order_id': '$orders.id$' }
      }
    , { table: 'cached_order_amenities', alias: 'amenities'
      , where: { 'cached_order_amenities.order_id': '$orders.id$' }
      }
    ];

    options.joins = [
      { type: 'left'
      , target: 'restaurants'
      , on: { id: '$orders.restaurant_id$' }
      }

    , { type: 'left'
      , target: 'regions'
      , on: { id: '$restaurants.region_id$' }
      }
    ];

    options.submittedDate = true;
    options.acceptedDate = true;

    rlogger.info('Filtering by %s', range, { start: start, end: end });
    db.orders.findStream(where, options, function(err, stream) {
      if (err) {
        rlogger.error('Unable to find orders', err);
        return res.end();
      }

      stream
        .pipe(through.obj(function (chunk, enc, done) {
          var order = Orders( chunk );

          res.csv.writeRow(
            [
              order.id
            , hbHelpers.orderTypeAbbr(order)

            // order.submitted is a timestamptz, it needs to be converted
            , order.submitted ?
                moment(order.submitted).tz(order.timezone).format(reports.dateFormat) :
                'N/A'

            , order.submitted ?
                moment(order.submitted).tz(order.timezone).format(reports.timeFormat) :
                'N/A'

            , order.accepted ?
                moment(order.accepted).tz(order.timezone).format(reports.dateFormat) :
                'N/A'

            , order.accepted ?
                moment(order.accepted).tz(order.timezone).format(reports.timeFormat) :
                'N/A'

            // order.datetime is a timestamp with separate order.timezone, needs to be parsed as such
            , moment.tz(order.datetime, order.timezone).format(reports.dateFormat)
            , moment.tz(order.datetime, order.timezone).format(reports.timeFormat)
            , getAddress(order)
            , order.type === 'courier' ? getAddress(order.location) : ''
            , order.restaurant.zip
            , order.zip
            , order.user.name
            , order.user.email
            , order.user.organization
            , order.phone
            , dollars(order.getSubTotal())
            , dollars(order.delivery_fee)
            , dollars(order.getTax())
            , dollars(order.tip)
            , dollars(order.adjustment_amount)
            , dollars(order.total)
            , order.restaurant.plan ? order.restaurant.plan.name : 'N/A'
            , dollars(orderCharge(order, 'getApplicationCut'))
            , dollars(orderCharge(order, 'getRestaurantCut'))
            , order.restaurant.name
            , order.restaurant.region.name
            ]
          );

          done();
        }))
        .pipe( res );
    });
  },

  usersCsv: function(req, res) {
    var start = req.query.start || '2012-01-01';
    var end = req.query.end || moment().format('YYYY-MM-DD');

    var filename = [
      'users'
    , start
    , end
    ].join('-') + '.csv';

    res.csv.writeFilename(filename);
    res.csv.writeRow([
      'Email'
    , 'First Name'
    , 'Last Name'
    , 'Company Name'
    , 'Region'
    ]);

    var options = {
      limit: 'all'
    , one: [{ table: 'regions', alias: 'region' }]
    };

    var where = {
      created_at: { $gte: start, $lte: end }
    };

    if (req.query.receives_promos) {
      where.receives_promos = true;
    }

    db.users.find(where, options, function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      results.forEach( function(user) {
        // break name apart if possible
        var idx = (user.name||'').indexOf(' ')
          , first = (idx >= 0) ? user.name.substring(0, idx) : user.name
          , last = (idx >= 0) ? user.name.substring(idx+1) : '';

        res.csv.writeRow([
          user.email
        , first
        , last
        , user.organization
        , user.region ? user.region.name : ''
        ]);
      });

      res.end();
    });
  },

  usersRedemptionsCsv: function(req, res) {
    res.csv.writeFilename('user-redemptions.csv');
    res.csv.writeRow([
      'User ID'
    , 'User Name'
    , 'User Email'
    , 'User Company'
    , 'Gift Card Type'
    , 'Gift Card Amount'
    , 'Gift Card Cost'
    ]);

    var query = {};
    var options = {
      limit : 'all'
    , one: [{ table: 'users', alias: 'user' }]
    };

    if (req.query.userId) query.user_id = req.query.userId;
    db.users_redemptions.find(query, options, function(error, redemptions) {
      redemptions.forEach(function(redemption) {
        res.csv.writeRow([
          redemption.user.id
        , redemption.user.name
        , redemption.user.email
        , redemption.user.organization
        , redemption.location
        , redemption.amount
        , redemption.cost
        ]);
      });
      res.end();
    });
  }
};

module.exports = reports;
