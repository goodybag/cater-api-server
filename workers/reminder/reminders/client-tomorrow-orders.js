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

module.exports.name = 'Client Tomorrow Orders';

module.exports.schema = {
  lastNotified: true
};

function getOrderQuery( storage ){
  return queries.orders.acceptedButNot(
    Object.keys( storage.lastNotified ).map( function( id ){
      return parseInt( id );
    }).filter(function(id){ return id !== 2800 })
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

module.exports.check = function( storage, callback ){
  var $query = getOrderQuery( storage );

  Models.Order.findTomorrow( $query, function( error, results ){
    if ( error ) return callback( error );

    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    usersNotified:        { text: 'Users Notified', value: 0 }
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