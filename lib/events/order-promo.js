/**
 * Events:Order Promo - notify Jacob
 */

var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:submitted:promo':
  function ( order ) {
    if (order.attributes.promo_code)
    if (order.attributes.promo_code === order.attributes.restaurant.promo_code) {

      this.logger.info('notify order promo code', {
        order: order
      });

      scheduler.enqueue('send-order-notification', new Date(), {
        order_id: order.attributes.id
      , notification_id: 'gb-order-promo-code'
      });
    }
  }
};