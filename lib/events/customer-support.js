/**
 * Events:Customer Support
 */
var utils = require('../../utils');
var scheduler = require('../scheduler');
var moment = require('moment-timezone');

module.exports = {
  'order:status:change':
  function( order, previous ){
    var logger = this.logger.create({
      data: { order: order.toJSON() }
    });

    if ( order.attributes.status !== 'submitted' ) return;

    order.getRestaurant( function( error ) {
      if ( error ){
        return logger.err( 'Error getting order restaurant', error );
      }

      if ( !order.attributes.restaurant.has_contract ) {
        scheduler.enqueue('non-contracted-restaurant-order', new Date(), {
          orderId: order.attributes.id
        }, function( error ){
          if ( error ) logger.error('Unable to notify CS of non-contracted restaurant order', error);
        });
      }

      var now = moment();
      var datetime = moment(order.datetime);
      var soon = datetime < now.add(1, 'days');

      if ( utils.isAfterHours(now) && utils.isAfterHours(datetime) && soon) {
        scheduler.enqueue('send-order-notification', new Date(), {
          notification_id: 'gb-after-hours-order-email'
        , order_id: order.attributes.id
        }, function( error ){
          if ( error ) logger.error('Unable to notify CS of after hours order via email', error);
        });

        scheduler.enqueue('send-order-notification', new Date(), {
          notification_id: 'gb-after-hours-order-sms'
        , order_id: order.attributes.id
        }, function( error ){
          if ( error ) logger.error('Unable to notify CS of after hours order via sms', error);
        });
      }
    });

  }
};
