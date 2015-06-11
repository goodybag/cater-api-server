/**
 * Events:Customer Support
 */
var utils = require('../../utils');
var scheduler = require('../scheduler');
var moment = require('moment-timezone');
var datetime = require('stamps/datetime');
var config = require('../../config');

module.exports = {
  'order:status:change':
  function( order, previous, notify ){
    var logger = this.logger.create({
      data: { order: order.toJSON() }
    });

    if ( notify === false ) return;
    if ( order.attributes.status !== 'submitted' ) return;

    order.getRestaurant( function( error ) {
      if ( error ){
        return logger.err( 'Error getting order restaurant', error );
      }

      if ( !order.attributes.restaurant.plan_id ) {
        scheduler.enqueue('non-contracted-restaurant-order', new Date(), {
          orderId: order.attributes.id
        }, function( error ){
          if ( error ) logger.error('Unable to notify CS of non-contracted restaurant order', error);
        });
      }

      var now = datetime({
        datetime: new Date()
      , businessHours: config.support.afterHours
      }).tz(order.attributes.timezone);

      var deliveryDate = datetime({
        datetime: order.attributes.datetime
      , businessHours: config.support.afterHours
      });

      if ( now.isAfterHours() )
      if ( deliveryDate.isAfterHours() )
      if ( deliveryDate.isWithin( 12, 'hours' ) ) {
        scheduler.enqueue('send-order-notification', new Date(), {
          notification_id: 'gb-after-hours-order-email'
        , order_id: order.attributes.id
        }, function( error ){
          if ( error ) logger.error('Unable to notify CS of after hours order via email', error);
        });

        // only send sms to our support team during regular hours
        var workingTime = datetime({
          timezone: 'America/Chicago'
        , businessHours: config.support.businessHours
        }).getWorkingTime().toISOString();

        scheduler.enqueue('send-order-notification', workingTime, {
          notification_id: 'gb-after-hours-order-sms'
        , order_id: order.attributes.id
        }, function( error ){
          if ( error ) logger.error('Unable to notify CS of after hours order via sms', error);
        });
      }
    });

  }
};
