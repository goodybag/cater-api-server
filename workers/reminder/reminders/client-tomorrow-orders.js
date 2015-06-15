/**
 * Client Tomorrow Orders
 *
 * Description:
 *   Send notifications to clients with accepted orders to
 *   be delivered tomorrow.
 */

var Models    = require('../../../models');
var utils     = require('../../../utils');
var config    = require('../../../config');
var notifier  = require('../../../lib/order-notifier');
var views     = require('../lib/views');
var queries   = require('../../../db/queries');
var moment    = require('moment-timezone');

module.exports.name = 'Client Tomorrow Orders';

module.exports.schema = {
  lastNotified: true
};

function getOrderQuery( storage ){
  return queries.orders.acceptedButNot(
    Object.keys( storage.lastNotified ).map( function( id ){
      return parseInt( id );
    })
  );
}

// Return the function for carrying out all the notifications
// for an order
function notifyOrderFn( order ){
  return utils.partial( utils.async.parallelNoBail, {
    email: function( done ){
      notifier.send('client-tomorrow-order', order.toJSON(), function( error ){
        // If successful, we want an easy way to know on the receiving end
        // So just pass back the original order object as the results
        done( error, error ? null : order );
      });
    }
  });
};

module.exports.find = function( storage, callback ){
  var $query = getOrderQuery( storage );

  Models.Order.findTomorrow( $query, function( error, orders ){
    if ( error ) return callback( error );

    // Filter to orders with timezones where it's currently 8am
    orders = orders.filter( function( order ){
      return moment().tz( order.attributes.timezone ).hour() === 8;
    });

    return callback( null, orders );
  });
};

module.exports.check = function( storage, callback ){
  module.exports.find( storage, function( error, orders ){
    if ( error ) return callback( error );

    return callback( null, orders.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    usersNotified:        { text: 'Users Notified', value: 0 }
  , errors:               { text: 'Errors', value: 0, objects: [] }
  };

  module.exports.find( storage, function( error, orders ){
    if ( error ) return callback( error );

    utils.async.parallel(
      orders.map( function( o ){
        return function( done ){ o.getOrderItems( done ); }
      }).concat( orders.map( function( o ){
        return function( done ){ o.getRestaurant( done ); }
      }))
    , function( error ){
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

              stats.usersNotified.value++;
              storage.lastNotified[ orders[ i ].attributes.id ] = new Date().toString();
            });

            return callback( errors, stats );
          }
        );
      }
    );
  });
};
