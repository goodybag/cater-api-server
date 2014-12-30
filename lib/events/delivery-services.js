/**
 * Events:Delivery Services
 */

var moment    = require('moment-timezone');
var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:type:change':
  function ( type, oldType, order ) {
    this.logger.info('Order type changed', { type: type, oldType: oldType });

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
      });
    }

    var notifyCourier = type === 'courier' &&
                        validState;

    if ( notifyCourier ) {
      scheduler.enqueue('send-order-notification', new Date(), {
        order_id: order.id
      , notification_id: 'delivery-service-order-submitted'
      });
    }
  },

  'order:status:change':
  function notifyAcceptedOrder( order, previous ){
    if ( order.attributes.type !== 'courier' ) return;

    var logger = this.logger;

    order.getRestaurant( function( error ){
      if ( error ){
        return logger.error( 'Error getting order restaurant', error );
      }

      var submitted = moment(order.attributes.submitted).tz(order.attributes.timezone);
      var day = submitted.day();
      var hour = submitted.hour();
      var weekend = ( day == 0 || day == 6 );
      var afterHours = ( hour >= 17 || hour <= 8 );

      logger.info('Checking to see what kind of notification to send', {
        submitted:  submitted
      , day:        day
      , hour:       hour
      , weekend:    weekend
      , afterHours: afterHours
      });

      if ( order.attributes.status === 'submitted' ){
        if ( weekend || afterHours ) {
          scheduler.enqueue('sms-gb-ds-after-hours', new Date(), { orderId: order.attributes.id });
        }
        // over the threshold, do not send to DS, just notify goodybaggers
        if ( order.attributes.sub_total >= order.attributes.restaurant.delivery_service_order_total_upperbound ){
          return scheduler.enqueue( 'send-order-notification', new Date(), {
            notification_id: 'delivery-service-order-above-threshold'
          , order_id:         order.attributes.id
          });
        } else {
          scheduler.enqueue( 'send-order-notification', new Date(), {
            notification_id: 'goodybaggers-ds-order'
          , order_id:         order.attributes.id
          });
          scheduler.enqueue('notify-delivery-service', new Date(), { orderId: order.attributes.id });
        }
      }

      if ( order.attributes.status === 'canceled' ){
        if ( [ 'submitted', 'accepted' ].indexOf(previous) >= 0 ){
          scheduler.enqueue('send-order-notification', new Date(), {
            order_id: order.attributes.id
          , notification_id: 'delivery-service-order-canceled'
          });
        }
      }
    });
  }
};