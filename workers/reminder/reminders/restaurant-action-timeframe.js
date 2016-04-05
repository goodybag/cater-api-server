/**
 * Restaurant Action Timeframe
 *
 * Description:
 *   Send us a notification if a restaurant has not taken action
 *   on an order within a certain timeframe
 */

var db          = require('../../../db');
var utils       = require('../../../utils');
var config      = require('../../../config');
var notifier    = require('../../../lib/order-notifier');
var FlowStream  = require('../../../lib/flow-stream');

module.exports.name = 'Restaurant Action Timeframe';

module.exports.schema = {
  lastNotified: true
};

var getQuery = function(){
  return {
    where: {
      status: 'submitted'
    , "submitted_dates.submitted": {
        $older_than: { value: 1, unit: 'hours' }
      }
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
    }
  , submittedDate: true
  };
};

module.exports.check = function( storage, callback ){
  var options = utils.extend( getQuery(), {
    limit: 1
  , order: ['id desc']
  });

  db.orders.find( {}, options, function( error, results ){
    if ( error ) return callback( error );

    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    sent:   { text: 'Notifications Sent', value: 0 }
  , errors: { text: 'Errors', value: 0, objects: [] }
  };

  db.orders.findStream( {}, getQuery(), function( error, ordersStream ){
    if ( error ) return callback( error );

    FlowStream
      .create( ordersStream, { concurrency: 5 } )
      .map( function( order, next ){
        notifier.send( 'order-submitted-but-ignored', order.id, function( error ){
          if ( error ){
            error.order_id = order.id;
          }

          return next( error, order );
        });
      })
      .errors( function( error ){
        stats.errors.objects.push( error );
      })
      .forEach( function( order ){
        stats.sent.value++;
        storage.lastNotified[ order.id ] = new Date().toString();
      })
      .end( function(){
        stats.errors.value = stats.errors.objects.length;
        callback( stats.errors.objects, stats );
      });
  });
};