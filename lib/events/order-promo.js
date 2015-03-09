/**
 * Events:Order Promo - notify Jacob
 */

var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:submitted:promo':
  /**
  * @param {object} - order  - restaurant order
  * @param {array} -  emails - list of email senders (see promo config)
  */
  function ( order ) {

    this.logger.info('notify order promo code', {
      order: order
    });

    console.log('############################')
    console.log('promo code enqueued')
    console.log('############################')

    scheduler.enqueue('send-order-notification', new Date(), {
      order_id: order.id
    , notification_id: 'gb-order-promo-code'
    });
  }
};
