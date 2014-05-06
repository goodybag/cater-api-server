/**
 * Accepted notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');

notifier.register({
  type: 'accepted'
, id: 'user-order-accepted'
, name: 'User Order Accepted'
, description: [
    'Sends the user on the order an email notifying them '
  , 'that their order was accepted'
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
    , subject:    [ 'Goodybag order (#', order.attributes.id, ') has been accepted' ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-accepted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});