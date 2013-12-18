/**
 * Tomorrow Orders
 *
 * Description:
 *   Checks for orders to be sent tomorrow
 */

var Models  = require('../../../models');

var getTomorrowOrders = function( callback ){
  var query = {
    where: {
      datetime: {
        $between_days_from_now: { from: 1, to: 2 }
      }
    }
  };

  Models.Order.find( query, callback );
}

module.exports.name = 'Tomorrow Orders';

module.exports.check = function( callback ){
  getTomorrowOrders( function( error, results ){
    if ( error ) return callback( error );

    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( callback ){
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