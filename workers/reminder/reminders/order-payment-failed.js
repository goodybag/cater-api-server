/**
 * Order Payment Failed Reminder
 *
 * Description:
 *   Checks for orders with payment_status = 'failed'
 *   sends a reminder to the tech team
 */

var db = require('../../../db');
var config = require('../../../config');
var notifier  = require('../../../lib/order-notifier');
var utils     = require('../../../utils');

module.exports.name = 'Remind Tech Order Payment Failed';

// Ensures typeof storage.lastNotified === 'object'
module.exports.schema = {
  notified: true
};

function getQuery( storage ){
  var $query = {
    payment_status: 'error'
  , datetime: { $gte: config.paymentFailedStartDate }
  };

  if ( Object.keys( storage.notified ).length > 0 ){
    $query.id = {
      $nin: Object.keys( storage.notified ).map( function( id ){
        return parseInt( id );
      })
    };
  }

  return $query;
}

module.exports.check = function( storage, callback ){
  db.orders.find( getQuery(storage), function(err, orders ){
    callback( err, !!orders && orders.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    orders: { text: 'Orders with failed payment', value: 0 }
  };

  db.orders.find( getQuery(storage), function(err, orders){
    if ( err ){
      callback( err );
    }

    var notifyFn = function () {
      notifier.send.bind( notifier, 'gb-order-payment-failed' ); 
      notifier.send.bind( notifier, 'user-order-payment-failed' ); 
    };

    utils.async.each( orders, notifyFn, function done( err ){
      if ( err ){
        return callback( err );
      }

      stats.orders.value = orders.length;

      orders.forEach( function( order ){
        storage.notified[ order.id ] = true;
      });

      callback( err, stats );
    });
  });
};
