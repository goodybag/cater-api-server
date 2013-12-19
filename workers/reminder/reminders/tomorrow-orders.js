/**
 * Tomorrow Orders
 *
 * Description:
 *   Checks for orders to be sent tomorrow
 */

var Models  = require('../../../models');
var utils   = require('../../../utils');

var getTomorrowOrders = function( callback ){
  var query = {
    where: {
      datetime: {
        $between_days_from_now: { from: 1, to: 2 }
      }
    }
  };

  Models.Order.find( query, callback );
};

module.exports.name = 'Tomorrow Orders';

module.exports.schema = {
  restaurantOrders: {
    lastNotified: true
  }
, userOrders: {
    lastNotified: true
  }
};

module.exports.check = function( storage, callback ){
  getTomorrowOrders( function( error, results ){
    if ( error ) return callback( error );

    results.forEach( function( result ){
      var notified = storage.restaurantsOrders.lastNotified;

      if ( !notified ) return;

      if 
    });

    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    restaurantsNotified:  { text: 'Restaurants Notified', value: 0 }
  , usersNotified:        { text: 'Users Notified', value: 0 }
  };

  getTomorrowOrders( function( error, orders ){
    if ( error ) return callback( error );

    console.log(orders);
    return callback( null, stats );
  });
};