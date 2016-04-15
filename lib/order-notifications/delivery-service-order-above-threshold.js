/**
 * Notification for when an order is submitted but the total
 * is over a certain threshold set on the restaurant. In this case,
 * we want to handle changing the order type and sending notification
 * manually.
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');
var db        = require('../../db');

notifier.register({
  type: 'accepted'
, id: 'delivery-service-order-above-threshold'
, name: 'Delivery Service Order Above Threshold'
, description: [
    'Sends goodybaggers a message if an order was submitted with an '
  , 'amount greater than the restaurants threshold for delivery service '
  , 'orders'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    };

    var email = {
      to:         config.deliveryServiceOrderAboveThresholdRecipients
    , from:       config.emails.couriers
    , subject:    [ 'Goodybag DS order (#', order.id, ') above amount threshold' ].join('')
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-delivery-service-order-above-threshold', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});
