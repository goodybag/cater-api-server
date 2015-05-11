/**
 * Restaurant Action Timeframe
 *
 * Description:
 *   Send us a notification if a restaurant has not taken action
 *   on an order within a certain timeframe
 */

var Models    = require('../../../models');
var utils     = require('../../../utils');
var config    = require('../../../config');
var notifier  = require('../../../lib/order-notifier');
var views     = require('../lib/views');
var helpers   = require('../../../public/js/lib/hb-helpers');

module.exports.name = 'Restaurant Action Timeframe';

if ( config.isProduction ){
  module.exports.alertEmails = [
    'om', 'jay', 'jag', 'jacobparker'
  ].map( function( n ){ return n + '@goodybag.com' });
} else {
  module.exports.alertEmails = [ config.testEmail ];
}

module.exports.schema = {
  lastNotified: true
};

// Return the function for carrying out all the notifications
// for an order
function notifyOrderFn( order ){
  return utils.partial( utils.async.parallelNoBail, {
    email: function( done ){
      notifier.send( 'order-submitted-but-ignored', order.attributes.id, function( error ){
        // If successful, we want an easy way to know on the receiving end
        // So just pass back the original order object as the results
        done( error, error ? null : order );
      });
    }
  });
};

var getQuery = function( storage ){
  // Query submitted orders older than 1 hour that hasn't already been notified
  var $query = {
    where: {
      status: 'submitted'
    , "submitted.created_at": {
        $older_than: { value: 1, unit: 'hours' }
      }
    }
  };

  if ( Object.keys( storage.lastNotified ).length > 0 ){
    $query.where.id = {
      $nin: Object.keys( storage.lastNotified ).map( function( id ){
        return parseInt( id );
      })
    };
  }

  return $query;
};

module.exports.check = function( storage, callback ){
  Models.Order.find( getQuery( storage ), function( error, results ){
    if ( error ) return callback( error );

    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    ordersHandled:        { text: 'Orders Handled', value: 0 }
  , errors:               { text: 'Errors', value: 0, objects: [] }
  };

  var $query = { where: { status: 'accepted' } };

  Models.Order.find( getQuery( storage ), function( error, orders ){
    if ( error ) return callback( error );

    utils.async.parallelNoBail(
      orders.map( notifyOrderFn )
    , function( errors, results ){
        if ( errors ){
          errors.forEach( function( e ){
            Object.keys( e ).forEach( function( k ){
              stats.errors.value++;
              stats.errors.objects.push( e[ k ] );
            });
          });
        }

        // Anything that came back in results is considered a success
        results.forEach( function( result, i ){
          if ( !result || Object.keys( result ).length === 0 ) return;

          stats.ordersHandled.value++;
          storage.lastNotified[ orders[ i ].attributes.id ] = new Date().toString();
        });

        return callback( errors, stats );
      }
    );
  });
};
