/**
 * Events:Delivery Services
 */

var moment    = require('moment-timezone');
var utils     = require('../../utils');
var db        = require('../../db');
var config    = require('../../config');
var scheduler = require('../scheduler');
var datetimeStamp = require('stamps/datetime');

module.exports = {
  'order:type:change':
  function ( type, oldType, order, user ) {
    var logger = this.logger;
    logger.info('Order type changed', { type: type, oldType: oldType });

    db.restaurants.findOne(order.restaurant_id, function(err, restaurant) {

      if ( err ) return logger.error('Error getting restaurant', order.restaurant_id);

      if ( restaurant.disable_courier_notifications ) return;
      // If order was courier and submitted or accepted, then we've already sent
      // the CS a notification. We'll need to send a cancellation if the order
      // type changes.
      var validState = utils.contains( ['submitted', 'accepted'], order.status );

      var cancelCourier = oldType === 'courier' &&
      type !== 'courier' &&
      validState;

      if ( cancelCourier ) {
        scheduler.enqueue('send-order-notification', new Date(), {
          order_id: order.id
        , notification_id: 'delivery-service-order-canceled'
        , delivery_service_id: order.delivery_service_id
        });
      }

      var notifyCourier = type === 'courier' &&
      validState;

      if ( notifyCourier ) {
        var options = {
          one: [{ table: 'delivery_services', alias: 'delivery_service' }]
        };

        db.orders.findOne( order.id, options, function( error, order ){
          if ( error ) return done( error );

          var dsnid = order.delivery_service.order_submitted_notification_id;

          if ( dsnid in notifier2.get() ){
            return notifier2
              .get( dsnid )
              ( order.id, user.attributes.id )
              .send( done );
          }

          var nid = dsnid in notifier.defs ? dsnid : 'delivery-service-order-submitted';
          
          notifier.send( nid, order.id, done );
        });

        scheduler.enqueue('send-order-notification', new Date(), {
          order_id: order.id
        , notification_id: 'delivery-service-order-submitted'
        });
      }
    });
  },

  'order:status:change':
  function notifyAcceptedOrder( order, previous, notify, user ){
    if ( notify === false ) return;
    if ( order.attributes.type !== 'courier' ) return;

    var logger = this.logger;

    order.getRestaurant( function( error ){
      if ( error ){
        return logger.error( 'Error getting order restaurant', error );
      }

      if ( order.attributes.status === 'canceled' ){
        if ( [ 'submitted', 'accepted', 'denied' ].indexOf(previous) >= 0 ){
          scheduler.enqueue('send-order-notification', new Date(), {
            order_id: order.attributes.id
          , notification_id: 'delivery-service-order-canceled'
          });
        }
      }

      if ( order.attributes.restaurant.disable_courier_notifications ) return;

      var datetime = datetimeStamp({ datetime: order.attributes.datetime });
      var submitted = datetimeStamp({ datetime: order.attributes.submitted });
      var weekend = datetime.isWeekend() && submitted.isWeekend();

      logger.info('Checking to see what kind of notification to send');

      if ( order.attributes.status === 'submitted' ){
        if ( weekend ) {
          scheduler.enqueue('send-order-notification', new Date(), {
            notification_id: 'gb-after-hours-order-sms'
          , order_id: order.attributes.id
          });
          scheduler.enqueue('send-order-notification', new Date(), {
            notification_id: 'gb-after-hours-order-email'
            , order_id: order.attributes.id
          });
        }

        // over the threshold, do not send to DS, just notify goodybaggers
        if ( order.attributes.sub_total >= order.attributes.restaurant.delivery_service_order_total_upperbound ){
          return scheduler.enqueue( 'send-order-notification', new Date(), {
            notification_id: 'delivery-service-order-above-threshold'
          , order_id:         order.attributes.id
          });
        } else {
          if ( moment(order.attributes.datetime) < moment().add(2, 'hours') ) {
            scheduler.enqueue( 'send-order-notification', new Date(), {
              notification_id: 'goodybaggers-asap-courier-order'
            , order_id:         order.attributes.id
            });
          }
          scheduler.enqueue('notify-delivery-service', new Date(), {
            orderId: order.attributes.id
          , user_id: user.attributes.id
          });
        }
      }
    });
  }
};
