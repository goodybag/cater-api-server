/**
 * Events:Customer Support
 */
var utils = require('../../utils');
var scheduler = require('../scheduler');

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
      var soon = datetime < now.add(1, 'day');

      if ( isAfterHours(now) && isAfterHours(datetime) && soon) {
        scheduler.enqueue('after-hours-order', new Date(), {
          orderId: order.attributes.id
        }, function( error ){
          if ( error ) logger.error('Unable to notify CS of after hours order', error);
        });
      }
    });

  }
};
