/**
 * Generate various reports in CSV
 */

var
  utils = require('../../utils')
, models = require('../../models')
, db = require('../../db')
, moment = require('moment')
, fs = require('fs')
, hbHelpers = require('../../public/js/lib/hb-helpers')
, errors = require('../../errors')
, config = require('../../config');


var dollars = hbHelpers.dollars;
var quoteVal = function(val) {
  return val ? '"'+val+'"' : '';
};

var reports = {

  dateFormat: 'MM-DD-YYYY hh:mm a',

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
    var status = req.query.status || 'accepted';
    var start = req.query.start || '2012-01-01';
    var end = moment(req.query.end || new Date()).add('d',1).format('YYYY-MM-DD');
    var range = req.query.range || 'datetime';
    var sort = req.query.sort || 'asc';
    var restaurantId = req.query.restaurantId;
    var userId = req.query.userId;
    var regionId = parseInt(req.query.region);

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
    , 'Delivery Date'
    , 'User Name'
    , 'User Email'
    , 'Company Name'
    , 'Subtotal'
    , 'Delivery Fee'
    , 'Tax'
    , 'Tip'
    , 'Total'
    , 'Caterer Name'
    , 'Region'
    ]);

    var where = { status: status, restaurant_id: { $notNull: true } };
    var options = { limit: 'all' };

    if ( restaurantId ) where.restaurant_id = restaurantId;
    if ( userId ) where.user_id = userId;
    // by order datetime or submitted
    range = (range === 'datetime') ? 'orders.datetime' : 'submitted.created_at';
    where[range] = {
      $gte: start
    , $lt: end
    };

    if ( regionId ) {
      where.region_id = regionId;
    }

    options.order = {};
    options.order[range] = sort;
    options.distinct = [ 'orders.id', range ];
    options.one = [
      { table: 'users', alias: 'user' }
    , { table: 'restaurants', alias: 'restaurant' }
    , { table: 'regions', alias: 'region' }
    ];
    options.submittedDate = true;

    db.orders.find(where, options, function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      results
        .forEach( function(order) {
          res.csv.writeRow([
            order.id
          , hbHelpers.orderTypeAbbr(order)
          , order.submitted ? 
              moment(order.submitted).format(reports.dateFormat) :
              'N/A'
          , moment(order.datetime).format(reports.dateFormat)
          , order.user.name
          , order.user.email
          , order.user.organization
          , dollars(order.sub_total)
          , dollars(order.delivery_fee)
          , dollars(order.sales_tax)
          , dollars(order.tip)
          , dollars(order.total)
          , order.restaurant.name
          , order.region.name
          ]);
        });
      res.end();
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
    ]);

    var query = {
      where: {
        created_at: { $gte: start, $lte: end }
      }
    , limit: 'all'
    };

    models.User.find(query, function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      results.forEach( function(user) {
        user = user.attributes;

        // break name apart if possible
        var idx = (user.name||'').indexOf(' ')
          , first = (idx >= 0) ? user.name.substring(0, idx) : user.name
          , last = (idx >= 0) ? user.name.substring(idx+1) : '';

        res.csv.writeRow([
          user.email
        , first
        , last
        , user.organization
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
