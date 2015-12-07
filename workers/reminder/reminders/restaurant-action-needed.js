/**
 * Restaurant action needed
 *
 * Description:
 *   Checks for submitted orders that have not been
 *   accepted or rejected. This will ping the restaurant
 *   every hour action has not been taken.
 */

module.exports.name = 'Restaurant Action Needed';
var db              = require('../../../db');
var utils           = require('../../../utils');
var notifier        = require('../../../lib/order-notifier');
var config          = require('../../../config');
var moment          = require('moment-timezone');

var getQuery = function( storage ){
  // 1. Filter submitted orders over an hour
  // 2. Filter orders where last notification over an hour
  var $query = {
    where: {
      status: 'submitted'
    , 'submitted_dates.submitted': { $older_than: config.reminders.actionNeeded.threshold }
    }
  };

  // Don't notify until one hour since last notification
  var recent = Object.keys(storage.lastNotified).reduce( function(list, id) {
    var hourAgo = new Date(new Date() - config.reminders.actionNeeded.interval);
    var date = new Date(storage.lastNotified[id]);
    if ( date >= hourAgo ) {
      list.push(id);
    }
    return list;
  }, []);

  if ( recent.length ) {
    $query.where.id = {
      $nin: recent
    };
  }

  return $query;
};

var getOptions = function( storage ){
  var options = {
    submittedDate: true
  };
  return options;
};

var withinBusinessHours = function (order) {
  // check whether or not the current time is
  // within business hours, based on orders timezone
  var now = moment().tz(order.timezone)
  , start = moment().tz(order.timezone)
  , end = moment().tz(order.timezone)
  , timeframe = config.reminders.actionNeeded.timeframe;

  start.set('hour', +timeframe.start.split(':')[0])
  start.set('minute', +timeframe.start.split(':')[1])

  end.set('hour', +timeframe.end.split(':')[0])
  end.set('minute', +timeframe.end.split(':')[1])

  return now.isBetween(start, end);
};

var getOrders = function ( storage, callback ) {
  db.orders.find( getQuery( storage ), getOptions( storage ), function( error, results ){
    if ( error ) return callback( error );

    results = results.filter( withinBusinessHours );

    return callback( null, results );
  });
};

var notifyOrderFn = function( order ) {
  return function( done ) {
    notifier.send( 'order-submitted-needs-action-sms', order.id, function(error) {
      done( error, error ? null : order );
    });
  };
};

module.exports.schema = {
  lastNotified: true
};

module.exports.check = function( storage, callback ){
  getOrders( storage,  function ( error, results ) {
    if ( error ) return callback( error );
    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    orders: { text: 'Idle submitted orders', value: 0 }
  , sent:   { text: 'Notifications Sent', value: 0 }
  , errors: { text: 'Errors', value: 0 }
  };

  getOrders( storage, function( error, orders ){
    if ( error ) return callback( error );
    stats.orders.value = orders.length;
    utils.async.parallelNoBail(orders.map(notifyOrderFn), function done(errors, results) {
      if ( errors ) {
        stats.errors.value = errors.length;
      }

      if (Array.isArray(results)) {
        results.forEach(function( result, i ){
          if ( !result || Object.keys(result).length === 0 ) return;

          stats.sent.value++;
        });
      }

      orders.forEach(function( order ){
        storage.lastNotified[ order.id ] = new Date().toString();
      });

      callback( errors, stats );
    });
  });
};
