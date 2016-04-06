/**
 * Restaurant action needed
 *
 * Description:
 *   Checks for submitted orders that have not been
 *   accepted or rejected. This will ping the restaurant
 *   every hour action has not been taken.
 */

module.exports.name = 'Restaurant Action Needed';

var db              = require('../../../db');
var utils           = require('../../../utils');
var notifier        = require('../../../lib/order-notifier');
var config          = require('../../../config');
var moment          = require('moment-timezone');
var FlowStream      = require('../../../lib/flow-stream');

var getQuery = function(){
  return {
    with: [
      { name: 'notifications_history'
      , type: 'select'
      , columns: [
          { expression: 'key::int', alias: 'order_id' }
        , { expression: "to_timestamp( value, 'Dy Mon DD YYYY HH24:MI:SS' )", alias: 'created_at' }
        ]
      , table: {
          alias: 'last_notified'
        , expression: {
            values: [ module.exports.name ]
          , expression: `
              select * from json_each_text(
                ( select "reminders"."data"->'lastNotified'
                  from "reminders"
                  where "reminders"."name" = $1
                )
              )
            `
          }
        }
      }
    ]
  , where: {
      status: 'submitted'
    , 'submitted_dates.submitted': { $older_than: config.reminders.actionNeeded.threshold }
    , withinBusinessHoursBegin: {
        $custom: ['extract( hour from now() at time zone regions.timezone ) >= $1', config.reminders.actionNeeded.timeframe.start]
      }
    , withinBusinessHoursEnd: {
        $custom: ['extract( hour from now() at time zone regions.timezone ) < $1', config.reminders.actionNeeded.timeframe.end]
      }
    , 'notifications_history.created_at': {
        $or: {
          $null: true
        , $older_than: config.reminders.actionNeeded.threshold
        }
      }
    }
  , joins: [
      { type: 'left'
      , target: 'notifications_history'
      , on: { 'notifications_history.order_id': '$orders.id$' }
      }
    , { type: 'left'
      , target: 'restaurants'
      , on: { 'orders.restaurant_id': '$restaurants.id$' }
      }
    , { type: 'left'
      , target: 'regions'
      , on: { 'restaurants.region_id': '$regions.id$' }
      }
    ]
  , submittedDate: true
  };
};

module.exports.schema = {
  lastNotified: true
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
        notifier.send( 'order-submitted-needs-action-sms', order.id, function( error ){
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
