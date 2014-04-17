/**
 * Canceled notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');

notifier.register({
  type: 'canceled'
, id: 'user-order-canceled'
, name: 'User Order Canceled'
, description: [
    'Sends an email notifying the user that their order was canceled'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON({ review: true })
    };

    var email = {
      to:         order.attributes.user.email
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.attributes.id + ' has been canceled!'
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-canceled', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'canceled'
, id: 'restaurant-order-canceled'
, name: 'Restaurant Order Canceled'
, description: [
    'Sends an email notifying the restaurant that their order was canceled'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON({ review: true })
    };

    var email = {
      to:         order.attributes.restaurant.emails
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.attributes.id + ' has been canceled!'
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-canceled', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'canceled'
, id: 'goodybaggers-order-canceled'
, name: 'Goodybaggers Order Canceled'
, description: [
    'Sends an email notifying Goodybaggers that an order was canceled'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON({ review: true })
    };

    var email = {
      to:         config.deniedRecipients
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.attributes.id + ' has been canceled!'
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-canceled', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});