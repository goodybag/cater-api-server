/**
 * Submitted notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');
var utils     = require('../../utils');

notifier.register({
  type: 'submitted'
, id: 'user-order-submitted'
, name: 'User Order Submitted'
, description: [
    'Sends the user on the order an email notifying them '
  , 'that their order was submitted'
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
    , subject:    [ 'Goodybag order (#', order.id, ') has been submitted' ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/user-order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'restaurant-order-submitted'
, name: 'Restaurant Order Submitted'
, description: [
    'Sends the restaurant on the order an email notifying them '
  , 'that an order was submitted'
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
    , subject:    'You have received a new Goodybag Order #' + order.id
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/restaurant-order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'goodybaggers-ds-order'
, name: 'Goodybaggers DS Order'
, description: [
    'Sends an email notifying Goodybaggers that DS order has been placed'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    };

    var email = {
      to:         config.emails.dsOrders
    , from:       config.emails.orders
    , subject:    '[DS] Goodybag Order #' + order.id + ' placed!'
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-ds-order', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});