/**
 * Client Tomorrow Orders
 *
 * Description:
 *   Send notifications to clients with accepted orders to
 *   be delivered tomorrow.
 */

var db          = require('../../../db');
var notifier    = require('../../../lib/order-notifier');
var FlowStream  = require('../../../lib/flow-stream');

module.exports.name = 'Client Tomorrow Orders';

module.exports.schema = {
  lastNotified: true
};

const ordersWhereClause = {
  status: 'accepted'

, id: {
    $nin: {
      type: 'select'
    , table: 'reminders'
    , columns: [
        { expression: "json_object_keys( reminders.data->'lastNotified' )::int" }
      ]
    , where: {
        name: module.exports.name
      }
    }
  }

, datetime: {
    $between_days_from_now: { from: 1, to: 2, timezone: 'orders.timezone' }
  }

  // Filter to orders with timezones where it's currently 8am
, $custom: ['extract( hour from now() at time zone orders.timezone ) = $1', 8]
};

module.exports.check = function( storage, callback ){
  // limit 1, id desc to make this check faster
  var options = { limit: 1, order: 'id desc' };

  db.orders.find( ordersWhereClause, options, function( error, orders ){
    if ( error ) return callback( error );
    return callback( null, orders.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    usersNotified:        { text: 'Users Notified', value: 0 }
  , errors:               { text: 'Errors', value: 0, objects: [] }
  };

  var options = {
    limit: 'all'
  };

  db.orders.findStream( ordersWhereClause, options, function( error, ordersStream ){
    if ( error ) return callback( error );

    var errors = [];

    FlowStream
      .create( ordersStream, { concurrency: 5 } )
      .map( function( order, next ){
        notifier.send( 'client-tomorrow-order', order.id, function( error ){
          return next( error, order );
        });
      })
      .errors( function( error ){
        stats.errors.objects.push( error );
      })
      .forEach( function( order ){
        stats.usersNotified.value++;
        storage.lastNotified[ order.id ] = new Date().toString();
      })
      .end( function(){
        stats.errors.value = stats.errors.objects.length;
        callback( stats.errors.objects, stats );
      });
  });
};
