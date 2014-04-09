/**
 * Canceled notification
 */

var notifier  = require('../notifier');
var app       = require('../../app');

notifier.register({
  type: 'canceled'
, name: 'Order Canceled'
, description: [
    'Sends us an email notifying them saying that an order was canceled'
  ].join('')
, build: function( order, logger, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON({ review: true })
    };

    app.render( 'order-email/order-canceled', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      var email = {
        to:         order.attributes.restaurant.emails
      , from:       config.emails.orders
      , subject:    'Goodybag Order #' + orderId + ' has been canceled!'
      , html:       html
      };

      callback( null, email );
    });
  }
});