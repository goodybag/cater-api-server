/**
 * Submitted notification
 */

var notifier  = require('../order-notifier');
var app       = require('../../app');

notifier.register({
  type: 'changed'
, id: 'restaurant-order-changed'
, name: 'Restaurant Order Changed'
, description: [
    'Sends the restaurant on the order an email notifying them '
  , 'that an order was changed'
  ].join('')
, build: function( order, logger, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON({ review: true })
    };

    app.render( 'order-email/order-changed', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      var email = {
        to:         order.attributes.restaurant.emails
      , from:       config.emails.orders
      , subject:    'Goodybag Order #' + orderId + ' has been changed!'
      , html:       html
      };

      callback( null, email );
    });
  }
});