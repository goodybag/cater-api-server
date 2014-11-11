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

  var staleIds = Object.keys(storage.lastNotified).reduce( function(list, id) {
    var hourAgo = new Date() - 60*60*1000;
    if ( storage.lastNotified[id] < hourAgo ) list.push(id);
    return list;
  }, []);

  if ( staleIds.length ) {
    $query.where.id = {
      $nin: staleIds
    };
  }

  return $query;
};

var getOptions = function( storage ){
  var options = {
    submittedDate: true
  , one: [ { table: 'restaurants', alias: 'restaurant', many: [
            { table: 'contacts', alias: 'contacts' }
          ] } ]
  };
  return options;
};

var notifyOrderFn = function( order ) {
  return function( done ) {
    // TODO create sms notification
    notifier.send( 'blah blah', order.id, function(error) {
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
  , errors: { text: 'Errors', value: 0 }
  };

  db.orders.find( getQuery( storage ), getOptions( storage ), function( error, orders ){
    if ( error ) return callback( error );

    utils.async.parallelNoBail(orders.map(notifyOrderFn), function done(errors, results) {
      if ( errors ) stats.errors.val = errors.length;
      console.log(results);
      /// TODO mark last notified = new Date()
    });
    stats.orders.value = results.length;
    callback( null, stats );
  });
};
