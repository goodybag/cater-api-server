/**
 * Restaurant action needed
 *
 * Description:
 *   Checks for submitted orders that have not been
 *   accepted or rejected. This will ping the restaurant
 *   every hour action has not been taken.
 */

module.exports.name = 'Restaurant Action Needed';
var db        = require('../../../db');

// Ensures typeof storage.lastNotified === 'object'
module.exports.schema = {
  lastNotified: true
};

var getQuery = function( storage ){
  var $query = {
    where: {
      status: 'submitted'
    , 'submitted_dates.submitted': { $older_than: { value: 1, unit: 'hours' } }
    }
  };

  return $query;
};

var getOptions = function( storage ){
  var options = {
    submittedDate: true
  };
  return options;
};

module.exports.check = function( storage, callback ){
  db.orders.find( getQuery( storage ), getOptions( storage ), function( error, results ){
    console.log(error);
    results.forEach(function(r) {
      console.log(r);
    });

    if ( error ) return callback( error );

    return callback( null, results.length > 0 );
  });
  callback( null, false );
};

module.exports.work = function( storage, callback ){
  var stats = {
    orders: { text: 'Idle submitted orders', value: 0 }
  };

  db.orders.find( getQuery( storage ), getOptions( storage ), function( error, results ){
    if ( error ) return callback( error );
    stats.orders.value = results.length;
    callback( null, stats );
  });
};
