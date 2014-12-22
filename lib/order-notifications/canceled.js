/**
 * Canceled notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');
var utils     = require('../../utils');

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
    , order:  order
    };

    var email = {
      to:         order.user.email
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.id + ' has been canceled!'
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/user-order-canceled', viewOptions, function( error, html ){
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
    , order:  order
    };

    var restaurantEmails = order.restaurant.contacts.filter( function( contact ){
      return !!contact.notify;
    }).map( function( contact ){
      return contact.emails;
    });

    restaurantEmails = utils.flatten( restaurantEmails );

    var email = {
      to:         restaurantEmails
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.id + ' has been canceled!'
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/restaurant-order-canceled', viewOptions, function( error, html ){
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
    , order:  order
    };

    var email = {
      to:         config.deniedRecipients
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.id + ' has been canceled!'
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-order-canceled', viewOptions, function( error, html ){
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
, id: 'delivery-service-order-canceled'
, name: 'Delivery Service Order Canceled'
, description: [
    'Sends an email notifying delivery service that an order was canceled'
  ].join('')
, isAvailable: function( order ){
    return order.type === 'courier';
  }
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    };

    var email = {
      to:         order.deliveryService.order_email.split(',')
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.id + ' has been canceled!'
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/delivery-service-order-canceled', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});
