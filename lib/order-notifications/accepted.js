/**
 * Accepted notification
 */

var notifier  = require('../order-notifier');
var scheduler = require('../scheduler');
var config    = require('../../config');
var app       = require('../../app');
var db        = require('../../db');

notifier.register({
  type: 'accepted'
, id: 'user-order-accepted'
, name: 'User Order Accepted'
, description: [
    'Sends the user on the order an email notifying them '
  , 'that their order was accepted'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var email = {
      to:         order.user.email
    , from:       config.emails.orders
    , subject:    [ 'Goodybag order (#', order.id, ') has been accepted' ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/user-order-accepted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'accepted'
, id: 'delivery-service-order-accepted'
, name: 'Delivery Service Order Accepted'
, description: [
    'Sends the delivery service an email notifying them the '
  , 'pickup and delivery info.'
  ].join('')
, isAvailable: function( order ){
    return order.type === 'courier';
  }
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order: order
    };

    var email = {
      to: order.deliveryService.order_email
    , from: config.emails.orders
    , subject: [ 'Goodybag order (#', order.id, ') has been scheduled for delivery' ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/delivery-service-order-accepted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

// Check that the order was accepted by the delivery service after some time
//
// NOTE: Not currently needed
//
// notifier.on('send:delivery-service-order-accepted', function(orderId) {
//   var datetime = moment().add('minutes', config.deliveryServices.responseThresholdMins).toDate();
//   scheduler.enqueue('delivery-service-order', datetime, { orderId: orderId } );
// });
