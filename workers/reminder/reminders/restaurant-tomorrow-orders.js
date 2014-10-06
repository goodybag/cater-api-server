/**
 * Restaurant Tomorrow Orders
 *
 * Description:
 *   Send notifications to restaurants with accepted orders to
 *   fulfill tomorrow. This module ensures that it does not send
 *   the same notification twice within the same window.
 */

var Models    = require('../../../models');
var utils     = require('../../../utils');
var config    = require('../../../config');
var notifier  = require('../../../lib/order-notifier');
var views     = require('../lib/views');
var queries   = require('../../../db/queries');
var db        = require('../../../db');

module.exports.name = 'Restaurant Tomorrow Orders';

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
      notifier.send('restaurant-tomorrow-order', order.toJSON({ reivew: true }), function( error ){
        // If successful, we want an easy way to know on the receiving end
        // So just pass back the original order object as the results
        done( error, error ? null : order );
      });
    }

  , sms: function( done ){
      // TODO:
      done( null, order );
    }
  });
};

module.exports.check = function( storage, callback ){
  var $query = getOrderQuery( storage );

  Models.Order.findTomorrow( $query, function( error, results ){
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
  , emailsSent:           { text: 'Emails Sent', value: 0 }
  , smsSent:              { text: 'Text Messages Sent', value: 0 }
  , ordersHandled:        { text: 'Orders Handled', value: 0 }
  , errors:               { text: 'Errors', value: 0, objects: [] }
  };

  var $query = getOrderQuery( storage );

  Models.Order.findTomorrow( $query, function( error, orders ){
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

              stats.ordersHandled.value++;
              storage.lastNotified[ orders[ i ].attributes.id ] = new Date().toString();

              if ( result.email ){
                stats.emailsSent.value += result.email.attributes.restaurant.emails.length;
              }

              if ( result.sms ){
                stats.smsSent.value += result.sms.attributes.restaurant.sms_phones.length;
              }
            });

            stats.restaurantsNotified.value = utils.unique( results, function( result ){
              return result[ Object.keys( result )[0] ].attributes.restaurant_id;
            }).length;

            return callback( errors, stats );
          }
        );
      }
    );
  });
};