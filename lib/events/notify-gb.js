/**
* Events: Notify Goodybag Team
*
*/

var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:paymentStatus:change:ignore':
  function ( orderId ) {
    this.logger.info('notify goodybag when payment status has changed', {
      orderId: orderId
    });

    var date = new Date();
    var offsetDays = 2;

    date.setDate(date.getDate() + offsetDays);

    scheduler.enqueue('send-payment-status-ignore-reminder', date, {
      order_id: orderId
    , notification_id: 'gb-order-payment-status-changed'
    });
  }
};
