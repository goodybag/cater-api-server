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
  function ( order, emails ) {

    this.logger.info('notify order promo code', {
      order: order
    });

    scheduler.enqueue('send-order-notification', new Date(), {
      order_id: order.id
    , emails: emails
    , notification_id: 'gb-order-promo-code'
    });
  }
};
