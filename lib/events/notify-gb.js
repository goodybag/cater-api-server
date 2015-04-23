/**
* Events: Notify Goodybag Team
*
*/

var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:paymentStatus:change':
  function ( paymentStatus, orderId ) {
    if (paymentStatus !== 'ignore') return;
    this.logger.info('notify GB when payment status has changed to ignore', {
      orderId: orderId
    });

    var date = new Date();
    var offsetDays = 2;

    date.setDate(date.getDate() + offsetDays);

    scheduler.enqueue('send-payment-status-ignore-reminder', date, {
      order_id: orderId
    });
  }
};
