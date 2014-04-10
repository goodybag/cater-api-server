/**
 * Submitted notification
 */

var notifier  = require('../order-notifier');
var app       = require('../../app');

notifier.register({
  type: 'submitted'
, name: 'User Order Submitted'
, description: [
    'Sends the user on the order an email notifying them '
  , 'that their order was submitted'
  ].join('')
, build: function( order, logger, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON()
    };

    app.render( 'order-email/order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      var email = {
        to:         order.attributes.user.email
      , from:       config.emails.orders
      , subject:    [ 'Goodybag order (#', orderId, ') has been submitted' ].join('')
      , html:       html
      };

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
, name: 'Restaurant Order Submitted'
, description: [
    'Sends the restaurant on the order an email notifying them '
  , 'that an order was submitted'
  ].join('')
, build: function( order, logger, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON({ review: true })
    };

    app.render( 'order-email/order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      var email = {
        to:         order.attributes.restaurant.emails
      , from:       config.emails.orders
      , subject:    'You have received a new Goodybag Order #' + orderId
      , html:       html
      };

      callback( null, email );
    });
  }
});