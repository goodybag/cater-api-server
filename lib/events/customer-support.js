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
          order_id: order.attributes.id
        }, function( error ){
        if ( error ) logger.error('Unable to notify CS of non-contracted restaurant order', error);
        });
      }
    });

  }
};
