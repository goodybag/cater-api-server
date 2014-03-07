/**
 * Generate various reports in CSV
 */

var
  utils = require('../../utils')
, models = require('../../models')
, moment = require('moment')
, fs = require('fs')
, hbHelpers = require('../../public/js/lib/hb-helpers')
, errors = require('../../errors')
, config = require('../../config')


var dollars = hbHelpers.dollars;
var quoteVal = function(val) {
  return val ? '"'+val+'"' : '';
}

var Reports = {

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
    var end = req.body.end || moment().format('YYYY-MM-DD');

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
    , 'Order Date'
    , 'Delivery Date'
    , 'Subtotal'
    , 'Delivery Fee'
    , 'Tax'
    , 'Tip'
    , 'Total'
    , 'Restaurant Name'
    ].join(',') + '\n');

    var query = {
      where: {
        status: status
      , datetime: {
          $gte: start
        , $lte: end
        }
      }
    , limit: 'all'
    };

    models.Order.find(query, function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      utils.each(results, function(order) {
        order = order.attributes;
        res.write(utils.map([
          order.id
        , moment(order.created_at).format(Reports.dateFormat)
        , moment(order.datetime).format(Reports.dateFormat)
        , dollars(order.sub_total)
        , dollars(order.restaurant.delivery_fee)
        , dollars( (order.sub_total + order.restaurant.delivery_fee) * config.taxRate)
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

    res.header( 'Content-Type', 'text/csv' );
    res.header( 'Content-Disposition', 'attachment;filename=' + filename );

    res.write([
      'Email'
    , 'First Name'
    , 'Last Name'
    , 'Company Name'
    ].join(',')+'\n');

    var query = {
      where: {
        created_at: { $gte: start, $lte: end }
      }
    , limit: 'all'
    };

    models.User.find(query, function(err, results) {
      if (err) return res.error(errors.internal.DB_FAILURE, err);
      utils.each(results, function(user) {
        user = user.attributes;
        var idx = (user.name||'').indexOf(' ');
        res.write(utils.map([
          user.email
        , user.name ? user.name.slice(0, idx) : ''
        , user.name ? user.name.slice(idx+1) : ''
        , user.organization
        ], quoteVal).join(',') + '\n');
      });

      res.end();
    });
  }
}

module.exports = Reports;
