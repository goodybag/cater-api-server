/**
 * Check Notifications
 *
 * Description:
 *   Make sure our order notifications are being sent.
 *   Since it seems that something is causing all notifications
 *   to not be sent, we _should_ be able to just check one type.
 */

var db        = require('../../../db');
var utils     = require('../../../utils');
var notifier  = require('../../../lib/order-notifier');
var config    = require('../../../config');
var views     = require('../lib/views');

module.exports.name = 'Check Notifications';

module.exports.schema = {
  notified: true
};

function getQuery( storage ){
  var query = {
    status: 'submitted'
  , id: {
      $nin: {
        type:     'select'
      , table:    'order_notifications'
      , columns:  ['order_id']
      }
    }
  };

  if ( Object.keys( storage.notified ).length > 0 ){
    query.id.$and = {
      $nin: Object.keys( storage.notified )
    };
  }

  return query;
}

module.exports.check = function( storage, callback ){
  db.orders.find( getQuery( storage ), function( error, results ){
    return callback( error, !!results && results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    ordersFlagged:        { text: 'Orders Flagged', value: 0 }
  };

  db.orders.find( getQuery( storage ), function( error, orders ){
    if ( error ){
      return callback( error );
    }

    utils.async.each( orders, notifier.send.bind( notifier, 'some-notifications-not-sent' ), function( error ){
      if ( error ){
        return callback( error );
      }

      stats.ordersFlagged.value = orders.length;

      orders.forEach( function( order ){
        storage.notified[ order.id ] = true;
      });

      callback( null, stats );
    });
  });
};