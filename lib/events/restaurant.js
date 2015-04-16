/**
 * Events:Restaurants
 */

var utils     = require('../../utils');
var pdfs      = require('../pdfs');
var scheduler = require('../scheduler');
var datetime  = require('stamps/datetime');
var config    = require('../../config');

module.exports = {
  'order:status:change':
  function( order, previous, notify ){
    var logger = this.logger.create({
      data: { order: order.toJSON() }
    });

    var orderId = order.attributes.id;
    var statusText = order.attributes.status;

    if ( statusText !== 'submitted' ) return;

    pdfs.manifest.build({ orderId: orderId }, function( error ){
      if ( error ){
        logger.error('Error scheduling pdf build for order #%s', orderId, error );
      }
    });

    if (notify === false) return;

    order.getRestaurant( function( error ){
      if ( error ){
        return logger.error( 'Error getting order restaurant', error );
      }

      // Manually handle orders set for DS and over a certain amount
      if ( order.attributes.type === 'courier' )
      if ( order.attributes.sub_total >= order.attributes.restaurant.delivery_service_order_total_upperbound ){
        return;
      }

      // Email Notification
      order.getOrderItems( function( error, items ){
        if ( error ){
          return logger.error( 'Error getting order items', error );
        }

        order.attributes.orderItems = items;

        scheduler.enqueue('send-order-notification', new Date(), {
          order_id: order.attributes.id
        , notification_id: 'restaurant-order-submitted'
        });
      });

      // Phone Notification
      if (order.attributes.restaurant.voice_phones) {

        var dt = datetime({ businessHours: config.notifications })
          .tz(order.attributes.timezone)
          .getWorkingTime()
          .toISOString();
        scheduler.enqueue('send-order-notification', dt, {
          order_id: order.attributes.id
        , notification_id: 'restaurant-order-submitted-voice'
        }, function( err, result) {
          if ( err ) logger.error('unable to schedule call', err );
        });
      }

      // Text Notification
      if (order.attributes.restaurant.sms_phones) {
        scheduler.enqueue('send-order-notification', new Date(), {
          order_id: order.attributes.id
        , notification_id: 'restaurant-order-submitted-sms'
        }, function(err, result) {
          if ( err ) logger.error('unable to schedule text', err );
        });
      }
    });
  }
};
