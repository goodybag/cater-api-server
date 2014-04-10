/**
 * Canceled notification
 */

var notifier  = require('../order-notifier');
var app       = require('../../app');

notifier.register({
  type: 'canceled'
, name: 'User Order Canceled'
, description: [
    'Sends an email notifying the user that their order was canceled'
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
        to:         order.attributes.user.emails
      , from:       config.emails.orders
      , subject:    'Goodybag Order #' + orderId + ' has been canceled!'
      , html:       html
      };

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'canceled'
, name: 'Restaurant Order Canceled'
, description: [
    'Sends an email notifying the restaurant that their order was canceled'
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

notifier.register({
  type: 'canceled'
, name: 'Goodybaggers Order Canceled'
, description: [
    'Sends an email notifying Goodybaggers that an order was canceled'
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
        to:         config.deniedRecipents
      , from:       config.emails.orders
      , subject:    'Goodybag Order #' + orderId + ' has been canceled!'
      , html:       html
      };

      callback( null, email );
    });
  }
});