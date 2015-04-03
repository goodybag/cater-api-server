/**
* Events: Notify Goodybag Team
*
*/

var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:paymentStatus:change': 
  function ( orderId ) {
    this.logger.info('notify goodybag when payment status has changed', {
      orderId: orderId
    });

    scheduler.enqueue('send-order-notification', new Date(), {
      order_id: orderId
    , notification_id: 'gb-order-payment-status-changed'
    });
  }
};
