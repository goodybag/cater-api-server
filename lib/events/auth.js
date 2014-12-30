/**
 * Events:Auth
 */

var db    = require('../../db');
var utils = require('../../utils');

module.exports = {
  'auth-with-guest-orders':
  /**
   * Whenever a user authenticates (registration or otherwise)
   * we need to transfer any "Guest Orders" that they had saved
   * to session to their account
   * @param  {Object} user        User object
   * @param  {Array}  guestOrders Array of Order IDs
   */
  function( user, guestOrders ){
    var logger = this.logger;

    logger.info('Consuming guest orders', {
      guestOrders: guestOrders
    });

    var onOrder = function( orderId, next ){
      logger.info('Transferring order #%s to user %s', orderId, user.attributes.id, {
        user:     user
      , order_id: orderId
      });

      db.orders.update( orderId, { user_id: user.attributes.id }, next );
    };

    utils.async.each( guestOrders, onOrder, function( error ){
      if ( error ){
        logger.error('Error consuming guest orders!', {
          error: error
        , guestOrders: guestOrders
        });
      }
    });
  }
}