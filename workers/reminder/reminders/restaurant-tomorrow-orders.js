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
  getTomorrowOrders( function( error, results ){
    if ( error ) return callback( error );

    // Filter out restaurants that have already been notified
    results = results.filter( function( result ){
      if ( !storage.lastNotified[ result.attributes.id ] ) return true;

      var notified = storage.lastNotified[ result.attributes.id ];
      notified = new Date( notified );

      var today = new Date();
      today.setHours( 0, 0, 0, 0 );

      return today > notified;
    });

    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    usersNotified:  { text: 'Users Notified', value: 0 }
  };

  getTomorrowOrders( function( error, orders ){
    if ( error ) return callback( error );

    console.log(orders);
    return callback( null, stats );
  });
};