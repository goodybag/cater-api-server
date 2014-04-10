/**
 * Accepted notification
 */

var notifier  = require('../order-notifier');
var app       = require('../../app');

notifier.register({
  type: 'accepted'
, id: 'user-order-accepted'
, name: 'User Order Accepted'
, description: [
    'Sends the user on the order an email notifying them '
  , 'that their oder was accepted'
  ].join('')
, build: function( order, logger, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON()
    };

    app.render( 'order-email/order-accepted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      var email = {
        to:         order.attributes.user.email
      , from:       config.emails.orders
      , subject:    [ 'Goodybag order (#', orderId, ') has been accepted' ].join('')
      , html:       html
      };

      callback( null, email );
    });
  }
});