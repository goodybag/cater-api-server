/**
 * Order submitted notifications
 *
 * Description:
 *   Checks for submitted orders and sends notifications
 *   at appropriate times (not in the middle of the night)
 */

var config = require('../../config');
var pivot = config.submittedNotificationStartDate;

module.exports.name = 'Order Submitted Notifcations';

// Ensures typeof storage.lastNotified === 'object'
module.exports.schema = {
  lastNotified: true
};

var getQuery = function( storage ) {
  var $query = {
    where: {
      status: 'submitted'
    , 'submitted.created_at': {
        $gt: pivot
      }
    }
  };

  if ( Object.keys( storage.lastNotified ).length > 0 ) {
    $query.where.id = {
      $nin: Object.keys( storage.lastNotified ).map( function( id ) {
        return parseInt( id );
      })
    };
  }

  return $query;
};

module.exports.check = function( storage, callback ){
  Models.Order.find( getQuery(storage), function( error, results ) {
    if ( error ) return callback( error );
    return callback( null, results.length > 0);
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    submittedOrders:     { text: 'Submitted Orders Notified', value: 0 }
  , errors:              { text: 'Errors', value: 0, objects: [] }
  };

  Models.Order.find( getQuery( storage ), function( error, orders ) {
    if ( error ) return callback( error );

    
  });
  stats.myStat.value++;

  callback( null, stats );
};
