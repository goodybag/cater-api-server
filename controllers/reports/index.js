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
    var status = req.body.status || 'accepted';
    var start = req.body.start || '2012-01-01';
    var end = moment(req.body.end || new Date()).add('d',1).format('YYYY-MM-DD');
    var range = req.body.range || 'datetime';
    var sort = req.body.sort || 'asc';
    var restaurantId = req.body.restaurantId;
    var userId = req.body.userId;


    var filename = [
      status
    , 'orders'
    , start
    , end
    ].join('-') + '.csv';

    res.header( 'Content-Type', 'text/csv' );
    res.header( 'Content-Disposition', 'attachment;filename=' + filename );

    res.write([
      'Order Number'
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
    ].join(',') + '\n');

    var where = { status: status };
    var options = { limit: 'all' };

    if ( restaurantId ) where.restaurant_id = restaurantId;
    if ( userId ) where.user_id = userId;
    // by order datetime or submitted
    range = (range === 'datetime') ? 'orders.datetime' : 'submitted.created_at';
    where[range] = {
      $gte: start
    , $lt: end
    };

    options.order = {};
    options.order[range] = sort;
    options.distinct = [ 'orders.id', range ];
    options.one = [
      { table: 'users', alias: 'user' }
    , { table: 'restaurants', alias: 'restaurant'}
    ];

    db.orders.find(where, options, function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      results.forEach( function(order) {
        res.write(utils.map([
          order.id
        , moment(order.submitted).format(reports.dateFormat)
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
        ], quoteVal).join(',') + '\n');
      });

      res.end();
    });

  },

  usersCsv: function(req, res) {
    var start = req.body.start || '2012-01-01';
    var end = req.body.end || moment().format('YYYY-MM-DD');

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

        res.csv.writeRowQuoted([
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
    db.users_redemptions.find(query, options, function(error, redemptions) {
      redemptions.forEach(function(redemption) {
        res.csv.writeRowQuoted([
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
