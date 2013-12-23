/**
 * Restaurant Tomorrow Orders
 *
 * Description:
 *   Send notifications to restaurants with orders tomorrow
 */

var Models  = require('../../../models');
var utils   = require('../../../utils');

module.exports.name = 'Restaurant Tomorrow Orders';

module.exports.schema = {
  lastNotified: true
};

module.exports.check = function( storage, callback ){
  Models.Order.findTomorrow( function( error, results ){
    if ( error ) return callback( error );

    // Filter out restaurants that have already been notified
    results = results.filter( function( result ){
      if ( !storage.lastNotified[ result.attributes.id ] ) return true;

      var notified = storage.lastNotified[ result.attributes.id ];
      notified = new Date( notified );

      if ( notified == 'Invalid Date' ) return true;

      var today = new Date();
      today.setHours( 0, 0, 0, 0 );

      return today > notified;
    });

    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    restaurantsNotified:  { text: 'Restaurants Notified', value: 0 }
  , peopleNotified:       { text: 'People Notified', value: 0 }
  , ordersHandled:        { text: 'Orders Handled', value: 0 }
  };

  Models.Order.findTomorrow( function( error, orders ){
    if ( error ) return callback( error );

    stats.ordersHandled.value = orders.length;

    return callback( null, stats );
  });
};