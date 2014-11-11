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
var notifier  = require('../../../lib/order-notifier');

// Ensures typeof storage.lastNotified === 'object'
module.exports.schema = {
  lastNotified: true
};

var getQuery = function( storage ){
  // 1. Filter submitted orders over an hour
  // 2. Filter orders where last notification over an hour
  var $query = {
    where: {
      status: 'submitted'
    , 'submitted_dates.submitted': { $older_than: { value: 1, unit: 'hours' } }
    }
  };

  var recent = Object.keys(storage.lastNotified).reduce( function(list, id) {
    var hourAgo = new Date(new Date() - 60*60*1000);
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

var notifyOrderFn = function( order ) {
  return function( done ) {
    notifier.send( 'order-submitted-needs-action-sms', order.id, function(error) {
      done( error, error ? null : order );
    });
  };
};

module.exports.check = function( storage, callback ){
  db.orders.find( getQuery( storage ), getOptions( storage ), function( error, results ){
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

  db.orders.find( getQuery( storage ), getOptions( storage ), function( error, orders ){
    if ( error ) return callback( error );
    stats.orders.value = orders.length;
    utils.async.parallelNoBail(orders.map(notifyOrderFn), function done(errors, results) {
      if ( errors ) {
        stats.errors.val = errors.length;
        return callback( errors, stats );
      }

      results.forEach(function( result, i ){
        if ( !result || Object.keys(result).length === 0 ) return;

        stats.sent.value++;
        storage.lastNotified[ result.id ] = new Date().toString();
      });

      callback( null, stats );
    });
  });
};
