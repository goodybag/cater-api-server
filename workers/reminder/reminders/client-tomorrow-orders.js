/**
 * Client Tomorrow Orders
 *
 * Description:
 *   Send notifications to clients with accepted orders to
 *   be delivered tomorrow.
 */

var Models  = require('../../../models');
var utils   = require('../../../utils');
var config  = require('../../../config');
var views   = require('../lib/views');

module.exports.name = 'Client Tomorrow Orders';

module.exports.schema = {
  lastNotified: true
};

// Return the function for carrying out all the notifications
// for an order
function notifyOrderFn( order ){
  return utils.partial( utils.async.parallelNoBail, {
    email: function( done ){
      views.render( 'order-email/order-reminder', {
        layout: 'email-layout'
      , config: config
      , order:  order.toJSON()
      }, function( error, html ){
        if ( error ) return done( error );

        utils.sendMail2({
          to:       order.attributes.user.email
        , from:     config.emails.orders
        , html:     html

        , subject:  [
                      'Goodybag Reminder: Order #'
                    , order.attributes.id
                    , ' to be delivered '
                    , order.attributes.datetime
                      ? 'on ' + order.attributes.datetime.split(' ')[0]
                      : 'tomorrow'
                    ].join('')
        }, function( error ){
          // If successful, we want an easy way to know on the receiving end
          // So just pass back the original order object as the results
          done( error, error ? null : order );
        });
      })
    }
  });
};

module.exports.check = function( storage, callback ){
  var $query = { where: { status: 'accepted' } };

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
    usersNotified:        { text: 'Users Notified', value: 0 }
  , errors:               { text: 'Errors', value: 0, objects: [] }
  };

  var $query = { where: { status: 'accepted' } };

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
            if ( error ){
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