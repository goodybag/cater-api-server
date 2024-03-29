/**
 * Events:Order Promo - notify Jacob
 */

var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:submitted:promo':
  function ( order ) {

    this.logger.info('notify order promo code', {
      order: order
    });

    scheduler.enqueue('send-order-notification', new Date(), {
      order_id: order.id
    , notification_id: 'gb-order-promo-code'
    });
  }
};
