/**
 * Submitted notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');

notifier.register({
  type: 'submitted'
, id: 'user-order-submitted'
, name: 'User-Order-Submitted'
, description: [
    'Sends the user on the order an email notifying them '
  , 'that their order was submitted'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON()
    };

    var email = {
      to:         order.attributes.user.email
    , from:       config.emails.orders
    , subject:    [ 'Goodybag order (#', order.attributes.id, ') has been submitted' ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-submitted', viewOptions, function( error, html ){
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
, name: 'Restaurant-Order-Submitted'
, description: [
    'Sends the restaurant on the order an email notifying them '
  , 'that an order was submitted'
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
    , subject:    'You have received a new Goodybag Order #' + order.attributes.id
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});