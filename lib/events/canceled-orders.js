/**
 * Events:CanceledOrders
 */

var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:status:change': function( order, previous, notify ){
    var logger     = this.logger;
    var orderId    = order.attributes.id;
    var statusText = order.attributes.status;

    // Only respond to canceled orders that were submitted or accepted
    if ( statusText !== 'canceled' ) return;
    if ( ['submitted', 'accepted'].indexOf( previous ) === - 1 ) return
    if ( notify === false ) return;

    [ 'user-order-canceled'
    , 'restaurant-order-canceled'
    , 'restaurant-order-canceled-sms'
    , 'goodybaggers-order-canceled'
    ].forEach( function( notification ){
      scheduler.enqueue( 'send-order-notification', new Date(), {
        order_id:         orderId
      , notification_id:  notification
      });
    });
  }
};
