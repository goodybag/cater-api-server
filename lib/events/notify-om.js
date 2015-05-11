/**
 * Events:Notifiy Om
 */

var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'order:status:change':
  function( order, previous, notify ){
    var logger = this.logger.create({
      data: { order: order.toJSON() }
    });

    if ( notify === false ) return;
    if ( order.attributes.status !== 'submitted' ) return;
    if ( !utils.contains(config.notableUserIds, order.attributes.user_id) ) return;

    scheduler.enqueue('send-order-notification', new Date(), {
      order_id: order.attributes.id
    , notification_id: 'notify-om-user-order'
    });
  }
};