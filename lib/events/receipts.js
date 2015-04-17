/**
 * Events:Receipts
 */

var pdfs  = require('../pdfs');
var utils = require('../../utils');
var notifier = require('../order-notifier');

module.exports = {
  // When the order changes, re-build the receipt PDF
  'order:change':
  function( orderId ){
    pdfs.receipt.build({ orderId: orderId }, function( error ){
      if ( error ){
        this.logger.error('Error scheduling pdf build for order #%s', orderId, error );
      }
    }.bind( this ));

    pdfs.manifest.build({ orderId: orderId }, function( error ){
      if ( error ){
        this.logger.error('Error scheduling pdf build for order #%s', orderId, error );
      }
    }.bind( this ));
  }

  // When the order status changes, send the client an email
  // When the order status changes to delivered, send the client an
  // email with the PDF receipt attached
, 'order:status:change':
  function( order, previous, notify ){
    var emailStatuses = [ 'submitted', 'accepted', 'denied' ];
    var orderId       = order.attributes.id;
    var statusText    = order.attributes.status;

    if ( !utils.contains( emailStatuses, statusText ) ) return;

    pdfs.receipt.build({ orderId: orderId }, function( error ){
      if ( error ){
        this.logger.error('Error scheduling pdf build for order #%s', orderId, error );
      }
    }.bind( this ));

    if ( notify === false ) return;

    order.getOrderItems( function( error, items ){
      if ( error ){
        return this.logger.error( 'Error getting order items', error );
      }

      order.attributes.orderItems = items;

      notifier.send( 'user-order-' + statusText, order.toJSON() );
    }.bind( this ));
  }
};
